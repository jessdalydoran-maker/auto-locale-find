import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if automation is enabled
  const { data: settings } = await supabase
    .from("automation_settings")
    .select("key, value");
  
  const settingsMap = new Map(settings?.map((s: any) => [s.key, s.value]) || []);
  
  const isManualRun = req.headers.get("x-manual-run") === "true";
  if (!isManualRun && settingsMap.get("automation_enabled") !== "true") {
    return new Response(
      JSON.stringify({ success: false, reason: "Automation disabled" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create log entry
  const { data: logEntry } = await supabase
    .from("automation_logs")
    .insert({ run_type: isManualRun ? "manual" : "weekly", status: "running" })
    .select()
    .single();

  const logId = logEntry?.id;
  const stats = {
    listings_added: 0,
    listings_updated: 0,
    listings_archived: 0,
    events_expired: 0,
    pages_published: 0,
    pages_unpublished: 0,
    duplicates_merged: 0,
  };

  try {
    // ─── 1. EXPIRE OLD EVENTS ───
    const { data: expiredCount } = await supabase.rpc("expire_old_events");
    stats.events_expired = expiredCount || 0;
    console.log(`Expired ${stats.events_expired} old events`);

    // ─── 2. DUPLICATE DETECTION & MERGE ───
    // Find duplicate listings by name + city_id (case-insensitive)
    const { data: allListings } = await supabase
      .from("listings")
      .select("id, name, slug, city_id, address, place_id, created_at, is_archived")
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (allListings) {
      const seen = new Map<string, string>(); // key -> id of first
      for (const listing of allListings) {
        const key = `${listing.name.toLowerCase().trim()}|${listing.city_id}`;
        if (seen.has(key)) {
          // Mark the newer duplicate as archived
          await supabase
            .from("listings")
            .update({ is_archived: true })
            .eq("id", listing.id);
          stats.duplicates_merged++;
        } else {
          seen.set(key, listing.id);
        }
      }
    }
    console.log(`Merged ${stats.duplicates_merged} duplicate listings`);

    // ─── 3. ARCHIVE INVALID LISTINGS ───
    // Archive listings with no name, no category, or no city
    const { data: archiveResult } = await supabase
      .from("listings")
      .update({ is_archived: true })
      .or("name.is.null,category_id.is.null,city_id.is.null")
      .eq("is_archived", false)
      .select("id");
    stats.listings_archived += archiveResult?.length || 0;

    // ─── 4. FIX BROKEN IMAGES ───
    // Replace null/empty image URLs with category-appropriate fallbacks
    const categoryFallbacks: Record<string, string> = {
      "restaurants": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
      "cafes": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop",
      "bars": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=400&fit=crop",
      "things-to-do": "https://images.unsplash.com/photo-1596394723269-e3e2b9eb8cb6?w=600&h=400&fit=crop",
      "gyms": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
    };

    const { data: categories } = await supabase
      .from("categories")
      .select("id, slug")
      .eq("is_active", true);

    if (categories) {
      for (const cat of categories) {
        const fallback = categoryFallbacks[cat.slug] || categoryFallbacks["things-to-do"];
        const { data: fixed } = await supabase
          .from("listings")
          .update({
            image_url: fallback,
            image_source: "fallback",
            image_alt: `${cat.slug} in Belfast`,
          })
          .eq("category_id", cat.id)
          .is("image_url", null)
          .eq("is_archived", false)
          .select("id");
        stats.listings_updated += fixed?.length || 0;
      }
    }

    // ─── 5. PAGE QUALITY CHECK ───
    const thresholdCategoryCity = parseInt(settingsMap.get("content_threshold_category_city") || "5");
    const thresholdModifier = parseInt(settingsMap.get("content_threshold_modifier") || "4");
    const priorityCity = settingsMap.get("priority_city") || "belfast";

    const { data: cities } = await supabase.from("cities").select("id, slug");
    const { data: activeCategories } = await supabase
      .from("categories")
      .select("id, slug")
      .eq("is_active", true);

    if (cities && activeCategories) {
      const priorityCities = cities.filter((c: any) => c.slug === priorityCity);
      const targetCities = priorityCities.length > 0 ? priorityCities : cities;

      for (const city of targetCities) {
        for (const cat of activeCategories) {
          // Count approved, non-archived listings
          const { count } = await supabase
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id)
            .eq("category_id", cat.id)
            .eq("is_approved", true)
            .eq("is_archived", false);

          const pageSlug = `${cat.slug}-${city.slug}`;
          const meetsThreshold = (count || 0) >= thresholdCategoryCity;

          // Upsert page_quality
          await supabase
            .from("page_quality")
            .upsert(
              {
                page_slug: pageSlug,
                content_count: count || 0,
                is_published: meetsThreshold,
                canonical_slug: `/${pageSlug}`,
                last_checked_at: new Date().toISOString(),
              },
              { onConflict: "page_slug" }
            );

          if (meetsThreshold) stats.pages_published++;
          else stats.pages_unpublished++;
        }
      }
    }

    // ─── 6. TRIGGER SEARCH HARVESTER ───
    try {
      const harvesterUrl = `${supabaseUrl}/functions/v1/harvest-search-trends`;
      const harvesterRes = await fetch(harvesterUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "weekly-update" }),
      });
      const harvesterData = await harvesterRes.json();
      console.log("Harvester results:", harvesterData);
    } catch (e) {
      console.error("Harvester failed (non-fatal):", e);
    }

    // ─── 7. UPDATE AUTOMATION LOG ───
    await supabase
      .from("automation_logs")
      .update({
        ...stats,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", logId);

    // Update last manual run timestamp
    if (isManualRun) {
      await supabase
        .from("automation_settings")
        .update({ value: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("key", "last_manual_run");
    }

    console.log("Weekly update completed:", stats);

    return new Response(
      JSON.stringify({ success: true, ...stats, log_id: logId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Weekly update error:", error);

    if (logId) {
      await supabase
        .from("automation_logs")
        .update({
          status: "failed",
          error_message: String(error),
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
