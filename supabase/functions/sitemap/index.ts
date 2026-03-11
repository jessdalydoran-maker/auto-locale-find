import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

/**
 * Content quality thresholds — mirrored from src/lib/content-quality.ts
 * Pages below these thresholds are excluded from the sitemap.
 */
const LISTINGS_MIN = 5;
const EVENTS_MIN = 1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const baseUrl = url.searchParams.get("base") || "https://cityscoutguide.co.uk";

  const [citiesRes, categoriesRes, modifiersRes, neighbourhoodsRes, listingsRes, eventsRes] =
    await Promise.all([
      supabase.from("cities").select("slug"),
      supabase.from("categories").select("slug").eq("is_active", true),
      supabase.from("modifiers").select("slug").eq("is_active", true),
      supabase
        .from("neighbourhoods")
        .select("slug, cities!inner(slug)")
        .eq("is_active", true),
      // Get listing counts by city+category for threshold check
      supabase
        .from("listings")
        .select("city_id, category_id, cities!inner(slug), categories!inner(slug)")
        .eq("is_approved", true),
      // Get active event counts by city
      supabase
        .from("events")
        .select("city_id, cities!inner(slug)")
        .eq("status", "active")
        .gte("date_start", new Date().toISOString().split("T")[0]),
    ]);

  const cities = citiesRes.data || [];
  const categories = categoriesRes.data || [];
  const modifiers = modifiersRes.data || [];
  const neighbourhoods = neighbourhoodsRes.data || [];
  const listings = listingsRes.data || [];
  const events = eventsRes.data || [];

  // Build content count maps
  const listingCounts = new Map<string, number>();
  for (const l of listings) {
    const citySlug = (l.cities as any)?.slug;
    const catSlug = (l.categories as any)?.slug;
    if (citySlug && catSlug) {
      const key = `${catSlug}-${citySlug}`;
      listingCounts.set(key, (listingCounts.get(key) || 0) + 1);
    }
  }

  const eventCounts = new Map<string, number>();
  for (const e of events) {
    const citySlug = (e.cities as any)?.slug;
    if (citySlug) {
      eventCounts.set(citySlug, (eventCounts.get(citySlug) || 0) + 1);
    }
  }

  const EVENT_CATEGORIES = new Set(["events", "whats-on", "live-music", "theatre", "comedy", "exhibitions", "markets", "festivals"]);

  function hasEnoughContent(catSlug: string, citySlug: string): boolean {
    if (EVENT_CATEGORIES.has(catSlug)) {
      return (eventCounts.get(citySlug) || 0) >= EVENTS_MIN;
    }
    return (listingCounts.get(`${catSlug}-${citySlug}`) || 0) >= LISTINGS_MIN;
  }

  const urls: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Static pages — always include
  urls.push(baseUrl);
  urls.push(`${baseUrl}/cities`);
  urls.push(`${baseUrl}/categories`);

  const timeIntents = ["today", "tonight", "this-week", "this-weekend"];

  for (const city of cities) {
    urls.push(`${baseUrl}/${city.slug}`);

    for (const cat of categories) {
      // Only include if enough content
      if (!hasEnoughContent(cat.slug, city.slug)) continue;

      // Base category+city — this is the canonical
      urls.push(`${baseUrl}/${cat.slug}-${city.slug}`);

      // Time variants only for event categories
      if (EVENT_CATEGORIES.has(cat.slug)) {
        for (const ti of timeIntents) {
          urls.push(`${baseUrl}/${cat.slug}-${city.slug}-${ti}`);
        }
      }

      // Modifier + category + city
      for (const mod of modifiers) {
        urls.push(`${baseUrl}/${mod.slug}-${cat.slug}-${city.slug}`);
      }
    }
  }

  // Neighbourhood pages — only if parent city+category has content
  for (const nb of neighbourhoods) {
    const citySlug = (nb.cities as any)?.slug;
    if (!citySlug) continue;

    for (const cat of categories) {
      if (!hasEnoughContent(cat.slug, citySlug)) continue;
      urls.push(`${baseUrl}/${cat.slug}-${nb.slug}-${citySlug}`);
    }
  }

  // Special alias pages — only if city has events
  for (const city of cities) {
    if ((eventCounts.get(city.slug) || 0) >= EVENTS_MIN) {
      urls.push(`${baseUrl}/whats-on-${city.slug}`);
      urls.push(`${baseUrl}/whats-on-${city.slug}-this-weekend`);
    }
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
