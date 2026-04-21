// Backfills image_url for listings missing an image, using Google Places photo
// then Street View Static as fallback. Processes in batches.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY")!;

async function findPlaceId(query: string): Promise<string | null> {
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

async function getFirstPhotoName(placeId: string): Promise<string | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "photos" },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.photos?.[0]?.name || null;
}

async function resolvePhotoUrl(photoName: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_KEY}&skipHttpRedirect=true`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.photoUri || null;
}

async function streetViewExists(lat?: number | null, lng?: number | null, address?: string | null): Promise<boolean> {
  let location: string;
  if (lat != null && lng != null) location = `${lat},${lng}`;
  else if (address) location = encodeURIComponent(address);
  else return false;
  const res = await fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${location}&key=${GOOGLE_KEY}`);
  if (!res.ok) return false;
  const json = await res.json();
  return json.status === "OK";
}

function streetViewUrl(lat?: number | null, lng?: number | null, address?: string | null): string | null {
  let location: string;
  if (lat != null && lng != null) location = `${lat},${lng}`;
  else if (address) location = encodeURIComponent(address);
  else return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${location}&fov=80&pitch=0&key=${GOOGLE_KEY}`;
}

async function resolveImage(l: any) {
  let placeId = l.place_id;
  if (!placeId && l.name) {
    const q = [l.name, l.address].filter(Boolean).join(", ");
    placeId = await findPlaceId(q);
  }
  if (placeId) {
    const photoName = await getFirstPhotoName(placeId);
    if (photoName) {
      const url = await resolvePhotoUrl(photoName);
      if (url) return { image_url: url, image_source: "google_places" };
    }
  }
  if (await streetViewExists(l.latitude, l.longitude, l.address)) {
    const url = streetViewUrl(l.latitude, l.longitude, l.address);
    if (url) return { image_url: url, image_source: "google_streetview" };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size ?? 25, 100);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: listings, error } = await supabase
      .from("listings")
      .select("id, name, address, place_id, latitude, longitude")
      .or("image_url.is.null,image_url.eq.")
      .eq("is_archived", false)
      .limit(batchSize);

    if (error) throw error;

    let updated = 0;
    let skipped = 0;
    let placesHits = 0;
    let streetViewHits = 0;
    const errors: string[] = [];

    for (const l of listings || []) {
      try {
        const result = await resolveImage(l);
        if (!result) { skipped++; continue; }
        const { error: upErr } = await supabase
          .from("listings")
          .update({
            image_url: result.image_url,
            image_source: result.image_source,
            image_status: "approved",
          })
          .eq("id", l.id);
        if (upErr) { errors.push(`${l.name}: ${upErr.message}`); continue; }
        updated++;
        if (result.image_source === "google_places") placesHits++;
        else streetViewHits++;
      } catch (e) {
        errors.push(`${l.name}: ${String(e)}`);
      }
    }

    const remaining = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .or("image_url.is.null,image_url.eq.")
      .eq("is_archived", false);

    return new Response(
      JSON.stringify({
        success: true,
        processed: listings?.length || 0,
        updated,
        skipped,
        places_hits: placesHits,
        streetview_hits: streetViewHits,
        remaining: remaining.count ?? 0,
        errors: errors.slice(0, 10),
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
