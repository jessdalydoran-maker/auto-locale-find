import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const baseUrl = url.searchParams.get("base") || "https://bestlocal.co.uk";

  const [citiesRes, categoriesRes, modifiersRes, neighbourhoodsRes] =
    await Promise.all([
      supabase.from("cities").select("slug"),
      supabase.from("categories").select("slug").eq("is_active", true),
      supabase.from("modifiers").select("slug").eq("is_active", true),
      supabase
        .from("neighbourhoods")
        .select("slug, cities!inner(slug)")
        .eq("is_active", true),
    ]);

  const cities = citiesRes.data || [];
  const categories = categoriesRes.data || [];
  const modifiers = modifiersRes.data || [];
  const neighbourhoods = neighbourhoodsRes.data || [];

  const urls: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Static pages
  urls.push(baseUrl);
  urls.push(`${baseUrl}/cities`);
  urls.push(`${baseUrl}/categories`);
  urls.push(`${baseUrl}/search`);

  const timeIntents = ["today", "tonight", "this-week", "this-weekend"];

  for (const city of cities) {
    // City page
    urls.push(`${baseUrl}/${city.slug}`);

    for (const cat of categories) {
      // category + city
      urls.push(`${baseUrl}/${cat.slug}-${city.slug}`);

      // category + city + time
      for (const ti of timeIntents) {
        urls.push(`${baseUrl}/${cat.slug}-${city.slug}-${ti}`);
      }

      // modifier + category + city
      for (const mod of modifiers) {
        urls.push(`${baseUrl}/${mod.slug}-${cat.slug}-${city.slug}`);

        // modifier + category + city + time
        for (const ti of timeIntents) {
          urls.push(`${baseUrl}/${mod.slug}-${cat.slug}-${city.slug}-${ti}`);
        }
      }
    }
  }

  // Neighbourhood pages
  for (const nb of neighbourhoods) {
    const citySlug = (nb.cities as any)?.slug;
    if (!citySlug) continue;

    for (const cat of categories) {
      urls.push(`${baseUrl}/${cat.slug}-${nb.slug}-${citySlug}`);
      for (const mod of modifiers) {
        urls.push(`${baseUrl}/${mod.slug}-${cat.slug}-${nb.slug}-${citySlug}`);
      }
      for (const ti of timeIntents) {
        urls.push(`${baseUrl}/${cat.slug}-${nb.slug}-${citySlug}-${ti}`);
      }
    }
  }

  // Special alias pages
  for (const city of cities) {
    urls.push(`${baseUrl}/whats-on-${city.slug}`);
    urls.push(`${baseUrl}/whats-on-${city.slug}-this-weekend`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.includes("today") || u.includes("tonight") ? "daily" : "weekly"}</changefreq>
    <priority>${u === baseUrl ? "1.0" : u.includes("belfast") ? "0.9" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
