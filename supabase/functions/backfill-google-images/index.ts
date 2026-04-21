// Backfills image_url for listings: fetches a Google Places photo (or Street View),
// downloads the bytes, uploads to the `venue-images` Supabase Storage bucket, and
// stores the resulting PUBLIC Supabase URL on the listing.
//
// Re-runnable: by default it processes listings whose image_url is missing OR still
// points at a Google-hosted URL (lh3.googleusercontent.com / maps.googleapis.com),
// which would 403 in the browser.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const BUCKET = "venue-images";

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

/** Download Places photo bytes directly (follow redirect to actual image). */
async function downloadPlacesPhoto(photoName: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_KEY}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { bytes, contentType };
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

async function downloadStreetView(lat?: number | null, lng?: number | null, address?: string | null): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  let location: string;
  if (lat != null && lng != null) location = `${lat},${lng}`;
  else if (address) location = encodeURIComponent(address);
  else return null;
  const url = `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${location}&fov=80&pitch=0&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { bytes, contentType };
}

function extFromContentType(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  return "jpg";
}

async function uploadToBucket(supabase: any, listingId: string, source: string, bytes: Uint8Array, contentType: string): Promise<string | null> {
  const ext = extFromContentType(contentType);
  const path = `listings/${listingId}-${source}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) {
    console.error("upload error", error);
    return null;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function resolveAndHost(supabase: any, l: any): Promise<{ image_url: string; image_source: string } | null> {
  // 1) Google Places photo
  let placeId = l.place_id;
  if (!placeId && l.name) {
    const q = [l.name, l.address].filter(Boolean).join(", ");
    placeId = await findPlaceId(q);
  }
  if (placeId) {
    const photoName = await getFirstPhotoName(placeId);
    if (photoName) {
      const dl = await downloadPlacesPhoto(photoName);
      if (dl && dl.bytes.byteLength > 1000) {
        const publicUrl = await uploadToBucket(supabase, l.id, "places", dl.bytes, dl.contentType);
        if (publicUrl) return { image_url: publicUrl, image_source: "google_places" };
      }
    }
  }
  // 2) Street View fallback
  if (await streetViewExists(l.latitude, l.longitude, l.address)) {
    const dl = await downloadStreetView(l.latitude, l.longitude, l.address);
    if (dl && dl.bytes.byteLength > 1000) {
      const publicUrl = await uploadToBucket(supabase, l.id, "streetview", dl.bytes, dl.contentType);
      if (publicUrl) return { image_url: publicUrl, image_source: "google_streetview" };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size ?? 20, 50);
    // mode: "missing" (null/empty only) | "google" (also re-host google-hosted) | "all"
    const mode: "missing" | "google" | "all" = body.mode ?? "google";
    const cityId: string | null = body.city_id ?? null;

    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase
      .from("listings")
      .select("id, name, address, place_id, latitude, longitude, image_url")
      .eq("is_archived", false)
      .limit(batchSize);

    if (mode === "missing") {
      query = query.or("image_url.is.null,image_url.eq.");
    } else if (mode === "google") {
      query = query.or(
        "image_url.is.null,image_url.eq.,image_url.like.%lh3.googleusercontent.com%,image_url.like.%maps.googleapis.com%",
      );
    }
    if (cityId) query = query.eq("city_id", cityId);

    const { data: listings, error } = await query;
    if (error) throw error;

    let updated = 0;
    let skipped = 0;
    let placesHits = 0;
    let streetViewHits = 0;
    const errors: string[] = [];

    for (const l of listings || []) {
      try {
        const result = await resolveAndHost(supabase, l);
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

    // Remaining count under same mode filter
    let remainingQuery = supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("is_archived", false);
    if (mode === "missing") {
      remainingQuery = remainingQuery.or("image_url.is.null,image_url.eq.");
    } else if (mode === "google") {
      remainingQuery = remainingQuery.or(
        "image_url.is.null,image_url.eq.,image_url.like.%lh3.googleusercontent.com%,image_url.like.%maps.googleapis.com%",
      );
    }
    if (cityId) remainingQuery = remainingQuery.eq("city_id", cityId);
    const remaining = await remainingQuery;

    return new Response(
      JSON.stringify({
        success: true,
        mode,
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
