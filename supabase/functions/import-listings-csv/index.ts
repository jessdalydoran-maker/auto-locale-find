import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";

async function findPlaceId(query: string): Promise<string | null> {
  if (!GOOGLE_KEY) return null;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.places?.[0]?.id || null;
}

async function getFirstPhotoUrl(placeId: string): Promise<string | null> {
  if (!GOOGLE_KEY) return null;
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "photos" },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const photoName = json.photos?.[0]?.name;
  if (!photoName) return null;
  const mediaRes = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_KEY}&skipHttpRedirect=true`);
  if (!mediaRes.ok) return null;
  const m = await mediaRes.json();
  return m.photoUri || null;
}

async function streetViewIfExists(lat: number | null, lng: number | null, address: string | null): Promise<string | null> {
  if (!GOOGLE_KEY) return null;
  let location: string;
  if (lat != null && lng != null) location = `${lat},${lng}`;
  else if (address) location = encodeURIComponent(address);
  else return null;
  const meta = await fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${location}&key=${GOOGLE_KEY}`);
  if (!meta.ok) return null;
  const j = await meta.json();
  if (j.status !== "OK") return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${location}&fov=80&pitch=0&key=${GOOGLE_KEY}`;
}

async function resolveImage(row: any): Promise<{ url: string | null; source: string }> {
  let placeId = row.place_id;
  if (!placeId && row.name) {
    placeId = await findPlaceId([row.name, row.address].filter(Boolean).join(", "));
  }
  if (placeId) {
    const url = await getFirstPhotoUrl(placeId);
    if (url) return { url, source: "google_places" };
  }
  const sv = await streetViewIfExists(row.latitude, row.longitude, row.address);
  if (sv) return { url: sv, source: "google_streetview" };
  return { url: null, source: "fallback" };
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get CSV URL from request body or use default
    const body = await req.json().catch(() => ({}));
    const csvUrl = body.csv_url;
    if (!csvUrl) {
      return new Response(JSON.stringify({ error: "csv_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const csvRes = await fetch(csvUrl);
    if (!csvRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch CSV: ${csvRes.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const csvText = await csvRes.text();
    const lines = csvText.split("\n").filter((l) => l.trim());
    const header = parseCSVLine(lines[0]);
    const colIndex: Record<string, number> = {};
    header.forEach((h, i) => (colIndex[h.trim()] = i));

    // Parse all rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 5) continue;
      rows.push({
        name: fields[colIndex["name"]] || "",
        slug: fields[colIndex["slug"]] || "",
        city_slug: fields[colIndex["city_slug"]] || "",
        category_slug: fields[colIndex["category_slug"]] || "",
        address: fields[colIndex["address"]] || null,
        phone: fields[colIndex["phone"]] || null,
        website: fields[colIndex["website"]] || null,
        rating: parseFloat(fields[colIndex["rating"]]) || null,
        review_count: parseInt(fields[colIndex["reviews"]]) || 0,
        latitude: parseFloat(fields[colIndex["latitude"]]) || null,
        longitude: parseFloat(fields[colIndex["longitude"]]) || null,
        short_description: fields[colIndex["short_description"]] || null,
        description: fields[colIndex["description"]] || null,
        image_url: fields[colIndex["photo"]] || null,
        google_maps_link: fields[colIndex["google_maps_link"]] || null,
        place_id: fields[colIndex["place_id"]] || null,
      });
    }

    console.log(`Parsed ${rows.length} rows from CSV`);

    // Get unique city_slugs and category_slugs
    const citySlugs = [...new Set(rows.map((r) => r.city_slug).filter(Boolean))];
    const catSlugs = [...new Set(rows.map((r) => r.category_slug).filter(Boolean))];

    // Load existing cities and categories
    const [citiesRes, catsRes] = await Promise.all([
      supabase.from("cities").select("id, slug"),
      supabase.from("categories").select("id, slug"),
    ]);

    const cityMap = new Map<string, string>();
    for (const c of citiesRes.data || []) cityMap.set(c.slug, c.id);

    const catMap = new Map<string, string>();
    for (const c of catsRes.data || []) catMap.set(c.slug, c.id);

    // Add missing cities
    const missingCities = citySlugs.filter((s) => !cityMap.has(s));
    let citiesAdded = 0;
    if (missingCities.length > 0) {
      const cityInserts = missingCities.map((slug) => ({
        name: slugToName(slug),
        slug,
        country: "UK",
      }));
      const { data: newCities, error: cityErr } = await supabase
        .from("cities")
        .insert(cityInserts)
        .select("id, slug");
      if (cityErr) console.error("City insert error:", cityErr);
      if (newCities) {
        for (const c of newCities) cityMap.set(c.slug, c.id);
        citiesAdded = newCities.length;
      }
    }

    // Add missing categories
    const missingCats = catSlugs.filter((s) => !catMap.has(s));
    let catsAdded = 0;
    if (missingCats.length > 0) {
      const catInserts = missingCats.map((slug) => ({
        name: slugToName(slug),
        slug,
        is_active: true,
      }));
      const { data: newCats, error: catErr } = await supabase
        .from("categories")
        .insert(catInserts)
        .select("id, slug");
      if (catErr) console.error("Category insert error:", catErr);
      if (newCats) {
        for (const c of newCats) catMap.set(c.slug, c.id);
        catsAdded = newCats.length;
      }
    }

    console.log(`Cities added: ${citiesAdded}, Categories added: ${catsAdded}`);

    // Check existing listing slugs to skip duplicates
    const existingSlugsRes = await supabase
      .from("listings")
      .select("slug");
    const existingSlugs = new Set(
      (existingSlugsRes.data || []).map((l: any) => l.slug)
    );

    // Prepare listings for insert
    const toInsert = [];
    let skipped = 0;
    let noCity = 0;
    let noCat = 0;

    for (const row of rows) {
      if (!row.slug || !row.name) { skipped++; continue; }
      if (existingSlugs.has(row.slug)) { skipped++; continue; }
      
      const city_id = cityMap.get(row.city_slug);
      const category_id = catMap.get(row.category_slug);
      
      if (!city_id) { noCity++; skipped++; continue; }
      if (!category_id) { noCat++; skipped++; continue; }

      let image_url: string | null = row.image_url;
      let image_source = row.image_url ? "csv" : "fallback";
      if (!image_url) {
        const resolved = await resolveImage(row);
        image_url = resolved.url;
        image_source = resolved.source;
      }

      toInsert.push({
        name: row.name,
        slug: row.slug,
        city_id,
        category_id,
        address: row.address,
        phone: row.phone,
        website: row.website,
        rating: row.rating,
        review_count: row.review_count,
        latitude: row.latitude,
        longitude: row.longitude,
        short_description: row.short_description,
        description: row.description,
        image_url,
        google_maps_link: row.google_maps_link,
        place_id: row.place_id,
        is_approved: true,
        is_archived: false,
        image_status: image_url ? "approved" : "needs_review",
        image_source,
      });
    }

    console.log(`To insert: ${toInsert.length}, Skipped: ${skipped} (no city: ${noCity}, no cat: ${noCat})`);

    // Batch insert in chunks of 200
    const BATCH = 200;
    let inserted = 0;
    let insertErrors = 0;

    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const { data, error } = await supabase
        .from("listings")
        .insert(batch)
        .select("id");
      if (error) {
        console.error(`Batch ${i}-${i + batch.length} error:`, error.message);
        insertErrors += batch.length;
      } else {
        inserted += (data?.length || 0);
      }
    }

    const summary = {
      success: true,
      total_csv_rows: rows.length,
      cities_added: citiesAdded,
      missing_cities: missingCities,
      categories_added: catsAdded,
      missing_categories: missingCats,
      listings_inserted: inserted,
      listings_skipped: skipped,
      skipped_no_city: noCity,
      skipped_no_category: noCat,
      insert_errors: insertErrors,
    };

    console.log("Import summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
