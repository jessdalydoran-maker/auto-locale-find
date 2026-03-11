import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 10;
    const slugs: string[] | undefined = body.slugs;

    // Get listings that need images
    let query = supabase
      .from("listings")
      .select("id, slug, name, website, image_url, image_status")
      .not("website", "is", null)
      .eq("is_approved", true)
      .eq("is_archived", false);

    if (slugs && slugs.length > 0) {
      query = query.in("slug", slugs);
    } else {
      // Only scrape listings without verified images
      query = query.or("image_url.is.null,image_status.neq.verified");
    }

    const { data: listings, error: fetchError } = await query.limit(batchSize);

    if (fetchError) throw fetchError;
    if (!listings || listings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No listings need images", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${listings.length} listings for images...`);

    const results: Array<{ slug: string; status: string; image_url?: string }> = [];

    for (const listing of listings) {
      try {
        console.log(`Scraping: ${listing.name} (${listing.website})`);

        // Use Firecrawl to scrape the page for metadata/images
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: listing.website,
            formats: ["html"],
            onlyMainContent: false,
            waitFor: 2000,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (!scrapeResponse.ok) {
          console.error(`Firecrawl error for ${listing.slug}:`, scrapeData);
          results.push({ slug: listing.slug, status: "error" });
          continue;
        }

        // Extract og:image or other image from metadata/HTML
        const html = scrapeData?.data?.html || scrapeData?.html || "";
        const metadata = scrapeData?.data?.metadata || scrapeData?.metadata || {};

        let imageUrl: string | null = null;

        // Priority 1: og:image from metadata
        if (metadata.ogImage) {
          imageUrl = metadata.ogImage;
        }

        // Priority 2: Parse og:image from HTML
        if (!imageUrl) {
          const ogMatch = html.match(
            /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
          );
          if (ogMatch) imageUrl = ogMatch[1];
        }

        // Priority 3: twitter:image
        if (!imageUrl) {
          const twMatch = html.match(
            /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
          );
          if (twMatch) imageUrl = twMatch[1];
        }

        // Priority 4: First large image in hero/banner area
        if (!imageUrl) {
          const imgMatches = html.match(
            /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
          );
          if (imgMatches) {
            for (const imgTag of imgMatches.slice(0, 10)) {
              const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
              if (srcMatch) {
                const src = srcMatch[1];
                // Skip tiny icons, SVGs, tracking pixels
                if (
                  !src.includes("favicon") &&
                  !src.includes("logo") &&
                  !src.endsWith(".svg") &&
                  !src.includes("pixel") &&
                  !src.includes("1x1") &&
                  !src.includes("data:image")
                ) {
                  imageUrl = src;
                  break;
                }
              }
            }
          }
        }

        if (imageUrl) {
          // Make relative URLs absolute
          if (imageUrl.startsWith("/")) {
            const urlObj = new URL(listing.website);
            imageUrl = `${urlObj.origin}${imageUrl}`;
          }

          // Update the listing
          const { error: updateError } = await supabase
            .from("listings")
            .update({
              image_url: imageUrl,
              image_source: "website",
              image_status: "needs_review",
              image_alt: `${listing.name} - venue image`,
            })
            .eq("id", listing.id);

          if (updateError) {
            console.error(`Update error for ${listing.slug}:`, updateError);
            results.push({ slug: listing.slug, status: "update_error" });
          } else {
            console.log(`✓ Image found for ${listing.name}: ${imageUrl}`);
            results.push({ slug: listing.slug, status: "success", image_url: imageUrl });
          }
        } else {
          console.log(`✗ No image found for ${listing.name}`);
          results.push({ slug: listing.slug, status: "no_image" });
        }

        // Rate limiting - 500ms between requests
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error processing ${listing.slug}:`, err);
        results.push({ slug: listing.slug, status: "error" });
      }
    }

    const succeeded = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status !== "success").length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        images_found: succeeded,
        no_image: failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scraper error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
