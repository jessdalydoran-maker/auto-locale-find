import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEED_KEYWORDS = [
  "things to do",
  "restaurants",
  "cafes",
  "bars",
  "events",
  "brunch",
  "date night",
  "gyms",
  "coffee shops",
  "nightlife",
  "family activities",
  "live music",
  "theatre",
  "comedy",
  "markets",
  "attractions",
  "tours",
  "museums",
  "parks",
  "cocktail bars",
  "hidden gems",
  "indoor activities",
  "escape rooms",
];

const LOCATIONS = [
  "Belfast",
  "Cathedral Quarter Belfast",
  "Titanic Quarter Belfast",
  "Ormeau Road Belfast",
  "Ballyhackamore Belfast",
  "Botanic Belfast",
  "Lisburn Road Belfast",
  "Queens Quarter Belfast",
];

const MODIFIERS = [
  "", "best", "cheap", "free", "romantic", "family",
  "late night", "vegan", "dog friendly", "outdoor", "indoor",
  "date night", "rainy day",
];

const TIME_INTENTS = [
  "", "today", "tonight", "this weekend", "this week",
];

/**
 * Fetch Google autocomplete suggestions for a query.
 * Uses the public Google Suggest API (no key needed).
 */
async function fetchSuggestions(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&gl=uk&hl=en&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Response format: [query, [suggestions]]
    return (data[1] || []) as string[];
  } catch {
    return [];
  }
}

/**
 * Convert a natural language suggestion to a URL slug.
 */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse a suggestion into structured parts: modifier, category, neighbourhood, city, timeIntent.
 */
function parseSuggestion(
  suggestion: string,
  categorySlugs: Set<string>,
  modifierSlugs: Set<string>,
  citySlugs: Set<string>,
  neighbourhoodSlugs: Set<string>,
  categoryMap: Map<string, string>,  // slug -> id
  modifierMap: Map<string, string>,
  cityMap: Map<string, string>,
  neighbourhoodMap: Map<string, string>,
): {
  slug: string;
  category_id: string | null;
  modifier_id: string | null;
  city_id: string | null;
  neighbourhood_id: string | null;
  valid: boolean;
} {
  const slug = toSlug(suggestion);
  const parts = slug.split("-");

  let category_id: string | null = null;
  let modifier_id: string | null = null;
  let city_id: string | null = null;
  let neighbourhood_id: string | null = null;
  let valid = false;

  // Try to match city (check from end)
  for (const [citySlug, id] of cityMap) {
    if (slug.endsWith(citySlug) || slug.includes(`-${citySlug}-`) || slug.includes(`-${citySlug}`)) {
      city_id = id;
      break;
    }
  }

  // Try to match category
  for (const [catSlug, id] of categoryMap) {
    if (slug.includes(catSlug)) {
      category_id = id;
      break;
    }
  }

  // Try to match modifier
  for (const [modSlug, id] of modifierMap) {
    if (slug.startsWith(modSlug + "-") || slug.includes(`-${modSlug}-`)) {
      modifier_id = id;
      break;
    }
  }

  // Try to match neighbourhood
  for (const [nbSlug, id] of neighbourhoodMap) {
    if (slug.includes(nbSlug)) {
      neighbourhood_id = id;
      break;
    }
  }

  // Valid if we have at least a category AND a city
  valid = !!(category_id && city_id);

  return { slug, category_id, modifier_id, city_id, neighbourhood_id, valid };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Load reference data
    const [categoriesRes, modifiersRes, citiesRes, neighbourhoodsRes] = await Promise.all([
      supabase.from("categories").select("id, slug, name").eq("is_active", true),
      supabase.from("modifiers").select("id, slug, name").eq("is_active", true),
      supabase.from("cities").select("id, slug, name"),
      supabase.from("neighbourhoods").select("id, slug, name, city_id").eq("is_active", true),
    ]);

    const categories = categoriesRes.data || [];
    const modifiers = modifiersRes.data || [];
    const cities = citiesRes.data || [];
    const neighbourhoods = neighbourhoodsRes.data || [];

    const categorySlugs = new Set(categories.map((c) => c.slug));
    const modifierSlugs = new Set(modifiers.map((m) => m.slug));
    const citySlugs = new Set(cities.map((c) => c.slug));
    const neighbourhoodSlugs = new Set(neighbourhoods.map((n) => n.slug));

    const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));
    const modifierMap = new Map(modifiers.map((m) => [m.slug, m.id]));
    const cityMap = new Map(cities.map((c) => [c.slug, c.id]));
    const neighbourhoodMap = new Map(neighbourhoods.map((n) => [n.slug, n.id]));

    // Also map multi-word category names to slugs for matching
    const categoryNameToSlug = new Map(categories.map((c) => [toSlug(c.name), c.slug]));

    // Generate all query combinations
    const queries: string[] = [];
    for (const keyword of SEED_KEYWORDS) {
      for (const location of LOCATIONS) {
        // Base: "keyword location"
        queries.push(`${keyword} ${location}`);
        // With modifiers: "best keyword location"
        for (const mod of MODIFIERS) {
          if (mod) queries.push(`${mod} ${keyword} ${location}`);
        }
        // With time intents: "keyword location this weekend"
        for (const ti of TIME_INTENTS) {
          if (ti) queries.push(`${keyword} ${location} ${ti}`);
        }
      }
    }

    // Deduplicate and limit to avoid rate limiting
    const uniqueQueries = [...new Set(queries)];
    // Process in batches with a small delay
    const BATCH_SIZE = 5;
    const allSuggestions = new Set<string>();
    let queriesProcessed = 0;

    // Limit total queries to prevent timeout (edge functions have 60s limit)
    const maxQueries = Math.min(uniqueQueries.length, 150);

    for (let i = 0; i < maxQueries; i += BATCH_SIZE) {
      const batch = uniqueQueries.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(fetchSuggestions));
      for (const suggestions of results) {
        for (const s of suggestions) {
          allSuggestions.add(s.toLowerCase());
        }
      }
      queriesProcessed += batch.length;
      // Small delay between batches to be respectful
      if (i + BATCH_SIZE < maxQueries) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    console.log(`Processed ${queriesProcessed} queries, got ${allSuggestions.size} unique suggestions`);

    // Parse and filter suggestions
    const validTrends: {
      query: string;
      slug: string;
      category_id: string | null;
      city_id: string | null;
    }[] = [];

    for (const suggestion of allSuggestions) {
      const parsed = parseSuggestion(
        suggestion,
        categorySlugs, modifierSlugs, citySlugs, neighbourhoodSlugs,
        categoryMap, modifierMap, cityMap, neighbourhoodMap,
      );

      if (parsed.valid) {
        validTrends.push({
          query: suggestion,
          slug: parsed.slug,
          category_id: parsed.category_id,
          city_id: parsed.city_id,
        });
      }
    }

    console.log(`Found ${validTrends.length} valid search trends`);

    // Upsert into search_trends
    let trendsAdded = 0;
    for (const trend of validTrends) {
      const { error } = await supabase
        .from("search_trends")
        .upsert(
          {
            query: trend.query,
            category_id: trend.category_id,
            city_id: trend.city_id,
            trend_score: 1,
            search_volume: 1,
          },
          { onConflict: "query" }
        );
      if (!error) trendsAdded++;
    }

    // ─── AUTO-GENERATE PAGES ───
    // For each valid trend, check if there's enough content to create a page
    const contentThreshold = 5;
    let pagesGenerated = 0;

    for (const trend of validTrends) {
      if (!trend.category_id || !trend.city_id) continue;

      // Count listings for this category+city
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("category_id", trend.category_id)
        .eq("city_id", trend.city_id)
        .eq("is_approved", true)
        .eq("is_archived", false);

      if ((count || 0) >= contentThreshold) {
        // Check if page already exists
        const { data: existing } = await supabase
          .from("programmatic_pages")
          .select("id")
          .eq("slug", trend.slug)
          .maybeSingle();

        if (!existing) {
          // Find category and city names for title generation
          const cat = categories.find((c) => c.id === trend.category_id);
          const city = cities.find((c) => c.id === trend.city_id);

          if (cat && city) {
            const title = `${cat.name} in ${city.name}`;
            const { error } = await supabase
              .from("programmatic_pages")
              .insert({
                slug: trend.slug,
                title,
                category_id: trend.category_id,
                city_id: trend.city_id,
                listing_count: count || 0,
                is_active: true,
                meta_description: `Discover the best ${cat.name.toLowerCase()} in ${city.name}. Browse ${count} curated listings with ratings, reviews and directions.`,
                intro_text: `Looking for ${cat.name.toLowerCase()} in ${city.name}? We've curated the top picks based on quality, reviews and local expertise.`,
              });

            if (!error) pagesGenerated++;
          }
        }

        // Also update page_quality
        await supabase
          .from("page_quality")
          .upsert(
            {
              page_slug: trend.slug,
              content_count: count || 0,
              is_published: true,
              canonical_slug: `/${trend.slug}`,
              last_checked_at: new Date().toISOString(),
            },
            { onConflict: "page_slug" }
          );

        // Mark trend as page_generated
        await supabase
          .from("search_trends")
          .update({ page_generated: true })
          .eq("query", trend.query);
      }
    }

    console.log(`Generated ${pagesGenerated} new pages`);

    return new Response(
      JSON.stringify({
        success: true,
        queries_processed: queriesProcessed,
        suggestions_found: allSuggestions.size,
        valid_trends: validTrends.length,
        trends_saved: trendsAdded,
        pages_generated: pagesGenerated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Harvester error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
