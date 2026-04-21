// Fetches a Google Places photo for a venue, falling back to Street View Static.
// Returns { image_url, image_source } and optionally updates a listing row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY")!;

/** Find a place_id via Places API (New) Text Search if we don't already have one. */
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

/** Get the first photo resource name for a place via Places API (New) Place Details. */
async function getFirstPhotoName(placeId: string): Promise<string | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "photos",
    },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.photos?.[0]?.name || null;
}

/** Resolve a Places photo resource name to a public media URL (follow redirect). */
async function resolvePhotoUrl(photoName: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_KEY}&skipHttpRedirect=true`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.photoUri || null;
}

/** Build a Street View Static URL for given coords or address. */
function streetViewUrl(opts: { lat?: number | null; lng?: number | null; address?: string | null }): string | null {
  let location: string;
  if (opts.lat != null && opts.lng != null) {
    location = `${opts.lat},${opts.lng}`;
  } else if (opts.address) {
    location = encodeURIComponent(opts.address);
  } else {
    return null;
  }
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${location}&fov=80&pitch=0&key=${GOOGLE_KEY}`;
}

/** Verify a Street View image actually exists at the location. */
async function streetViewExists(opts: { lat?: number | null; lng?: number | null; address?: string | null }): Promise<boolean> {
  let location: string;
  if (opts.lat != null && opts.lng != null) location = `${opts.lat},${opts.lng}`;
  else if (opts.address) location = encodeURIComponent(opts.address);
  else return false;
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location}&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return false;
  const json = await res.json();
  return json.status === "OK";
}

/** Main resolver — exported for reuse. */
export async function resolveGoogleImage(input: {
  name?: string;
  address?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{ image_url: string | null; image_source: string }> {
  // 1. Places photo
  let placeId = input.place_id || null;
  if (!placeId && input.name) {
    const q = [input.name, input.address].filter(Boolean).join(", ");
    placeId = await findPlaceId(q);
  }
  if (placeId) {
    const photoName = await getFirstPhotoName(placeId);
    if (photoName) {
      const url = await resolvePhotoUrl(photoName);
      if (url) return { image_url: url, image_source: "google_places" };
    }
  }
  // 2. Street View fallback
  if (await streetViewExists({ lat: input.latitude, lng: input.longitude, address: input.address })) {
    const url = streetViewUrl({ lat: input.latitude, lng: input.longitude, address: input.address });
    if (url) return { image_url: url, image_source: "google_streetview" };
  }
  return { image_url: null, image_source: "fallback" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { listing_id, persist = true } = body;
    if (!listing_id) {
      return new Response(JSON.stringify({ error: "listing_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: listing, error } = await supabase
      .from("listings")
      .select("id, name, address, place_id, latitude, longitude")
      .eq("id", listing_id)
      .single();
    if (error || !listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await resolveGoogleImage(listing);
    if (persist && result.image_url) {
      await supabase
        .from("listings")
        .update({
          image_url: result.image_url,
          image_source: result.image_source,
          image_status: "approved",
        })
        .eq("id", listing_id);
    }
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
