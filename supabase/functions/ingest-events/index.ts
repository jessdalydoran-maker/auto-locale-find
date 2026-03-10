import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";

interface EventCandidate {
  title: string;
  date_start: string;
  date_end?: string;
  time_start?: string;
  time_end?: string;
  venue_name?: string;
  venue_address?: string;
  venue_town?: string;
  description?: string;
  short_description?: string;
  ticket_url?: string;
  official_url?: string;
  price?: string;
  is_free?: boolean;
  is_family_friendly?: boolean;
  is_indoor?: boolean;
  is_outdoor?: boolean;
  tags?: string[];
  image_url?: string;
  category?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/** Scrape page content using Firecrawl (handles JS-rendered sites) */
async function fetchWithFirecrawl(url: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`Firecrawl error for ${url}: ${resp.status} ${errText}`);
      return null;
    }

    const data = await resp.json();
    const markdown = data?.data?.markdown || data?.markdown || "";
    return markdown.slice(0, 15000) || null;
  } catch (e) {
    console.error(`Firecrawl fetch failed for ${url}:`, e);
    return null;
  }
}

/** Fallback: simple HTML fetch for sites that don't need JS rendering */
async function fetchSimple(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "CityScoutGuide/1.0 EventBot" },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);
  } catch {
    return null;
  }
}

async function extractEventsWithAI(
  pageContent: string,
  sourceName: string,
  sourceTown: string | null,
  councilArea: string | null,
  apiKey: string
): Promise<EventCandidate[]> {
  const today = new Date().toISOString().split("T")[0];

  const prompt = `You are an event data extraction assistant for Northern Ireland. Extract real upcoming events from the following web page content from "${sourceName}" (${councilArea || "NI"}, ${sourceTown || "unknown town"}).

RULES:
- Only extract REAL events with specific dates (not general venue info or permanent exhibitions)
- Only include events from ${today} onwards
- Each event must have at minimum: title, date_start (YYYY-MM-DD format)
- Set is_free to true only if clearly stated as free/no charge
- Set is_family_friendly to true for events explicitly suitable for children, families, or with child-friendly content
  - Examples of family-friendly: children's shows, family workshops, kids theatre, puppet shows, storytelling, craft sessions, family festivals, community fun days, Easter/Christmas family events, outdoor trails, zoo visits, science workshops for kids
  - NOT family-friendly by default: comedy gigs, concerts, boxing, professional sport fixtures, late-night events, bar events
- Set venue_town to the specific town where the event takes place (e.g., "Antrim", "Cookstown", "Enniskillen")
- Use tags from: music, theatre, comedy, film, art, exhibitions, festival, food, market, workshop, dance, literature, family, kids, outdoor, indoor, nightlife, sport, community, heritage, craft, storytelling, science, nature, trails
  - Add "kids" tag for events specifically for children
  - Add "family" tag for events suitable for whole family
  - Add "workshop" tag for hands-on activity sessions
- For time_start/time_end use HH:MM:SS format (24h)
- Keep descriptions concise (1-2 sentences)
- Extract ticket links where visible
- If you cannot find real events with dates, return an empty array
- Do NOT invent or generate events. Only extract what is explicitly on the page.

Return a JSON array of events. Example:
[{"title":"Kids Theatre: Mr Hullabaloo","date_start":"2026-04-15","time_start":"14:00:00","venue_name":"Courtyard Theatre","venue_town":"Antrim","description":"Interactive theatre show for children aged 3-7","tags":["theatre","kids","family"],"is_free":false,"is_family_friendly":true,"price":"£6"}]

Web page content:
${pageContent}`;

  try {
    const resp = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!resp.ok) {
      console.error(`AI gateway error: ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("AI extraction error:", e);
    return [];
  }
}

/** Resolve a town name to a city_id in the database */
async function resolveCityId(
  supabase: any,
  town: string | null,
  councilArea: string | null,
  cityCache: Map<string, string>
): Promise<string | null> {
  if (!town && !councilArea) return null;

  // Try town first
  const lookups = [town, councilArea].filter(Boolean) as string[];
  for (const name of lookups) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (cityCache.has(slug)) return cityCache.get(slug)!;

    const { data } = await supabase
      .from("cities")
      .select("id, slug")
      .or(`slug.eq.${slug},name.ilike.%${name}%`)
      .limit(1)
      .maybeSingle();

    if (data) {
      cityCache.set(slug, data.id);
      return data.id;
    }
  }

  // Fallback: try to match council area to known city mappings
  const COUNCIL_CITY_MAP: Record<string, string> = {
    "belfast": "belfast",
    "antrim & newtownabbey": "antrim",
    "ards & north down": "bangor",
    "armagh banbridge craigavon": "armagh",
    "causeway coast & glens": "coleraine",
    "derry city & strabane": "derry",
    "fermanagh & omagh": "enniskillen",
    "lisburn & castlereagh": "lisburn",
    "mid & east antrim": "ballymena",
    "mid ulster": "cookstown",
    "newry mourne & down": "newry",
  };

  if (councilArea) {
    const mapped = COUNCIL_CITY_MAP[councilArea.toLowerCase()];
    if (mapped && cityCache.has(mapped)) return cityCache.get(mapped)!;
    if (mapped) {
      const { data } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", mapped)
        .maybeSingle();
      if (data) {
        cityCache.set(mapped, data.id);
        return data.id;
      }
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!lovableApiKey) {
    return new Response(
      JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse optional filters
  let sourceFilter: string | null = null;
  let maxSources = 10;
  let cityFilter: string | null = null;
  try {
    const body = await req.json();
    sourceFilter = body?.source_type || null;
    maxSources = body?.max_sources || 10;
    cityFilter = body?.city_slug || null;
  } catch {}

  // Create automation log
  const { data: logEntry } = await supabase
    .from("automation_logs")
    .insert({ run_type: "event-ingestion", status: "running" })
    .select()
    .single();
  const logId = logEntry?.id;

  const stats = {
    sources_checked: 0,
    events_found: 0,
    events_added: 0,
    events_updated: 0,
    events_skipped: 0,
    firecrawl_used: 0,
    fallback_used: 0,
    errors: [] as string[],
  };

  // City ID cache to reduce lookups
  const cityCache = new Map<string, string>();

  try {
    // Pre-load all cities into cache
    const { data: allCities } = await supabase.from("cities").select("id, slug, name");
    if (allCities) {
      for (const c of allCities) {
        cityCache.set(c.slug, c.id);
        cityCache.set(c.name.toLowerCase(), c.id);
      }
    }

    // Resolve city filter
    let cityId: string | null = null;
    if (cityFilter) {
      cityId = cityCache.get(cityFilter) || null;
    }

    // Fetch active sources
    let query = supabase
      .from("event_sources")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .limit(maxSources);

    if (sourceFilter) {
      query = query.eq("source_type", sourceFilter);
    }
    if (cityId) {
      query = query.eq("city_id", cityId);
    }

    const { data: sources, error: srcErr } = await query;
    if (srcErr) throw srcErr;
    if (!sources || sources.length === 0) {
      throw new Error("No active event sources found");
    }

    // Expire past events first
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("events")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("date_start", today);

    for (const source of sources) {
      stats.sources_checked++;
      const url = source.events_url || source.website_url;
      if (!url) {
        console.log(`Skipping ${source.name}: no URL`);
        continue;
      }

      console.log(`Fetching events from: ${source.name} (${url})`);

      // Try Firecrawl first, fallback to simple fetch
      let content: string | null = null;
      if (firecrawlApiKey) {
        content = await fetchWithFirecrawl(url, firecrawlApiKey);
        if (content && content.length > 100) {
          stats.firecrawl_used++;
        }
      }

      if (!content || content.length < 100) {
        content = await fetchSimple(url);
        if (content && content.length > 100) {
          stats.fallback_used++;
        }
      }

      if (!content || content.length < 100) {
        stats.errors.push(`${source.name}: failed to fetch content`);
        continue;
      }

      console.log(`${source.name}: got ${content.length} chars, extracting events...`);

      const candidates = await extractEventsWithAI(
        content,
        source.name,
        source.town || null,
        source.council_area || null,
        lovableApiKey
      );
      stats.events_found += candidates.length;
      console.log(`${source.name}: found ${candidates.length} event candidates`);

      for (const event of candidates) {
        if (!event.title || !event.date_start) {
          stats.events_skipped++;
          continue;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date_start)) {
          stats.events_skipped++;
          continue;
        }

        // Check for duplicate by slug
        const eventSlug = slugify(`${event.title}-${event.date_start}`);
        const { data: existing } = await supabase
          .from("events")
          .select("id, status")
          .eq("slug", eventSlug)
          .maybeSingle();

        if (existing) {
          // Re-activate if previously expired but still valid
          if (existing.status === "expired" && event.date_start >= today) {
            await supabase
              .from("events")
              .update({ status: "active", updated_at: new Date().toISOString() })
              .eq("id", existing.id);
            stats.events_updated++;
          } else {
            stats.events_skipped++;
          }
          continue;
        }

        // Resolve town to city_id
        const eventTown = event.venue_town || source.town || null;
        const eventCouncilArea = source.council_area || null;
        const resolvedCityId = source.city_id || await resolveCityId(supabase, eventTown, eventCouncilArea, cityCache);

        if (!resolvedCityId) {
          console.warn(`Cannot resolve city for "${event.title}" (town: ${eventTown}, council: ${eventCouncilArea})`);
          stats.events_skipped++;
          continue;
        }

        const venueName = event.venue_name || (source.source_type === "venue" ? source.name : null);
        const allTags = [...new Set([...(event.tags || []), ...(source.tags || [])])];

        const { error: insertErr } = await supabase.from("events").insert({
          title: event.title,
          slug: eventSlug,
          date_start: event.date_start,
          date_end: event.date_end || null,
          time_start: event.time_start || null,
          time_end: event.time_end || null,
          venue_name: venueName,
          venue_address: event.venue_address || null,
          description: event.description || null,
          short_description: event.short_description || event.description?.slice(0, 160) || null,
          ticket_url: event.ticket_url || null,
          official_url: event.official_url || url,
          price: event.price || null,
          is_free: event.is_free || false,
          is_family_friendly: event.is_family_friendly || false,
          is_indoor: event.is_indoor ?? true,
          is_outdoor: event.is_outdoor ?? false,
          tags: allTags,
          city_id: resolvedCityId,
          council_area: eventCouncilArea,
          source_url: url,
          source_id: `${source.name}:${eventSlug}`,
          status: "active",
          image_url: event.image_url || null,
          image_source: event.image_url ? "scraped" : "fallback",
          image_status: "needs_review",
        });

        if (insertErr) {
          console.error(`Insert error for "${event.title}":`, insertErr.message);
          stats.events_skipped++;
        } else {
          stats.events_added++;
        }
      }

      // Update last scraped timestamp
      await supabase
        .from("event_sources")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", source.id);
    }

    if (logId) {
      await supabase
        .from("automation_logs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          details: stats as any,
          listings_added: stats.events_added,
          listings_updated: stats.events_updated,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Ingestion error:", msg);

    if (logId) {
      await supabase
        .from("automation_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: msg,
          details: stats as any,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: false, error: msg, stats }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
