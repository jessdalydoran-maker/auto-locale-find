import { useSearchParams, Link } from "react-router-dom";
import { setPageCanonical } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { SearchBar } from "@/components/SearchBar";
import { parseSearchIntent } from "@/lib/search-intent";
import { scoreListing, scoreEvent, rankAndFilter, filterByCity } from "@/lib/search-scoring";
import { Search, Calendar, MapPin } from "lucide-react";
import { deduplicateListings, filterCompleteListings } from "@/lib/page-validation";
import { useMemo, useEffect } from "react";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const intent = parseSearchIntent(query);

  useEffect(() => { setPageCanonical(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`); }, [query]);

  // Resolve city ID from slug
  const { data: resolvedCity } = useQuery({
    queryKey: ["resolve-city", intent.city],
    queryFn: async () => {
      if (!intent.city) return null;
      const { data } = await supabase
        .from("cities")
        .select("id, slug, name, nearby_city_slugs")
        .eq("slug", intent.city)
        .maybeSingle();
      return data;
    },
    enabled: !!intent.city,
    staleTime: 1000 * 60 * 10,
  });

  // Resolve nearby city IDs for fallback
  const { data: nearbyCities } = useQuery({
    queryKey: ["nearby-cities", resolvedCity?.nearby_city_slugs],
    queryFn: async () => {
      if (!resolvedCity?.nearby_city_slugs?.length) return [];
      const { data } = await supabase
        .from("cities")
        .select("id, slug, name")
        .in("slug", resolvedCity.nearby_city_slugs);
      return data || [];
    },
    enabled: !!resolvedCity?.nearby_city_slugs?.length,
    staleTime: 1000 * 60 * 10,
  });

  // Main listings query — strict 3-tier location hierarchy
  const { data: rawListings, isLoading } = useQuery({
    queryKey: ["search", query, resolvedCity?.id, nearbyCities?.map(c => c.id).join(",")],
    queryFn: async () => {
      if (!query.trim()) return { exact: [] as any[], nearby: [] as any[], niWide: [] as any[] };

      const selectFields = "*, cities!inner(slug, name), categories!inner(slug, name)";
      const exactResults: any[] = [];
      const nearbyResults: any[] = [];
      const niWideResults: any[] = [];

      // Helper to run category + audience + name queries within a set of city IDs
      async function fetchForCities(cityIds: string[], limit: number) {
        const results: any[] = [];

        // Name match
        const { data: nameMatches } = await supabase
          .from("listings")
          .select(selectFields)
          .in("city_id", cityIds)
          .ilike("name", `%${query.trim()}%`)
          .limit(limit);
        if (nameMatches) results.push(...nameMatches);

        // Category intent
        if (intent.categorySlugs.length > 0) {
          const { data: cats } = await supabase
            .from("categories")
            .select("id, slug")
            .in("slug", intent.categorySlugs);
          if (cats?.length) {
            const catIds = cats.map(c => c.id);
            const { data } = await supabase
              .from("listings")
              .select(selectFields)
              .in("category_id", catIds)
              .in("city_id", cityIds)
              .order("rating", { ascending: false })
              .limit(limit);
            if (data) results.push(...data);
          }

          // Audience tags
          for (const tag of intent.categorySlugs.slice(0, 2)) {
            const { data } = await supabase
              .from("listings")
              .select(selectFields)
              .contains("audience_tags", [tag])
              .in("city_id", cityIds)
              .limit(Math.ceil(limit / 2));
            if (data) results.push(...data);
          }
        }

        // Text search within cities
        const textTerms = intent.keywords.filter(w => w.length > 2);
        if (textTerms.length > 0 && results.length < 5) {
          const orClauses = textTerms
            .map(t => `name.ilike.%${t}%,short_description.ilike.%${t}%`)
            .join(",");
          const { data } = await supabase
            .from("listings")
            .select(selectFields)
            .in("city_id", cityIds)
            .or(orClauses)
            .limit(limit);
          if (data) results.push(...data);
        }

        // If generic "things to do" with no specific matches, show top-rated
        if (results.length === 0 && (intent.categorySlugs.length === 0 || intent.categorySlugs.includes("things-to-do"))) {
          const { data } = await supabase
            .from("listings")
            .select(selectFields)
            .in("city_id", cityIds)
            .order("rating", { ascending: false })
            .limit(limit);
          if (data) results.push(...data);
        }

        return results;
      }

      if (resolvedCity) {
        // ── TIER 1: Exact town match ──
        const tier1 = await fetchForCities([resolvedCity.id], 40);
        exactResults.push(...tier1);

        // ── TIER 2: Nearby towns (only if exact < 5) ──
        if (exactResults.length < 5 && nearbyCities?.length) {
          const nearbyIds = nearbyCities.map(c => c.id);
          const tier2 = await fetchForCities(nearbyIds, 15);
          nearbyResults.push(...tier2);
        }

        // ── TIER 3: NI-wide (only if exact + nearby < 3) ──
        if (exactResults.length + nearbyResults.length < 3) {
          const excludeIds = [resolvedCity.id, ...(nearbyCities?.map(c => c.id) || [])];
          const textTerms = intent.keywords.filter(w => w.length > 2);

          if (intent.categorySlugs.length > 0) {
            const { data: cats } = await supabase
              .from("categories")
              .select("id, slug")
              .in("slug", intent.categorySlugs);
            if (cats?.length) {
              const catIds = cats.map(c => c.id);
              let q = supabase
                .from("listings")
                .select(selectFields)
                .in("category_id", catIds)
                .order("rating", { ascending: false })
                .limit(10);
              const { data } = await q;
              if (data) {
                // Exclude already-fetched cities
                const filtered = data.filter(d => !excludeIds.includes(d.city_id));
                niWideResults.push(...filtered);
              }
            }
          } else if (textTerms.length > 0) {
            const orClauses = textTerms
              .map(t => `name.ilike.%${t}%,short_description.ilike.%${t}%`)
              .join(",");
            const { data } = await supabase
              .from("listings")
              .select(selectFields)
              .or(orClauses)
              .limit(10);
            if (data) {
              const filtered = data.filter(d => !excludeIds.includes(d.city_id));
              niWideResults.push(...filtered);
            }
          }
        }
      } else {
        // ── No location specified: broad search ──
        const { data: nameMatches } = await supabase
          .from("listings")
          .select(selectFields)
          .ilike("name", `%${query.trim()}%`)
          .limit(20);
        if (nameMatches) exactResults.push(...nameMatches);

        if (intent.categorySlugs.length > 0) {
          const { data: cats } = await supabase
            .from("categories")
            .select("id, slug")
            .in("slug", intent.categorySlugs);
          if (cats?.length) {
            const catIds = cats.map(c => c.id);
            const { data } = await supabase
              .from("listings")
              .select(selectFields)
              .in("category_id", catIds)
              .order("rating", { ascending: false })
              .limit(30);
            if (data) exactResults.push(...data);
          }
        }

        const textTerms = intent.keywords.filter(w => w.length > 2);
        if (textTerms.length > 0) {
          const orClauses = textTerms
            .map(t => `name.ilike.%${t}%,short_description.ilike.%${t}%,description.ilike.%${t}%`)
            .join(",");
          const { data } = await supabase
            .from("listings")
            .select(selectFields)
            .or(orClauses)
            .limit(20);
          if (data) exactResults.push(...data);
        }
      }

      // Deduplicate across all tiers
      const seenIds = new Set<string>();
      const dedup = (arr: any[]) => arr.filter(item => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      });

      return {
        exact: dedup(exactResults),
        nearby: dedup(nearbyResults),
        niWide: dedup(niWideResults),
      };
    },
    enabled: !!query && (intent.city ? resolvedCity !== undefined : true),
  });

  // Score and rank listings
  const { rankedExact, rankedNearby } = useMemo(() => {
    if (!rawListings) return { rankedExact: [], rankedNearby: [] };

    const scoredExact = rawListings.exact.map(item => ({
      item,
      score: scoreListing(item, query, intent),
    }));
    const exact = rankAndFilter(scoredExact, 20, intent.hasExplicitLocation);
    const { unique: uniqueExact } = deduplicateListings(exact as any);
    const filteredExact = filterCompleteListings(uniqueExact);

    const scoredNearby = rawListings.nearby.map(item => ({
      item,
      score: scoreListing(item, query, { ...intent, city: null, hasExplicitLocation: false }),
    }));
    const nearby = rankAndFilter(scoredNearby, 20, false);
    const { unique: uniqueNearby } = deduplicateListings(nearby as any);
    const filteredNearby = filterCompleteListings(uniqueNearby);

    return { rankedExact: filteredExact, rankedNearby: filteredNearby };
  }, [rawListings, query]);

  // Search events — location-filtered
  const { data: eventResults } = useQuery({
    queryKey: ["search-events", query, resolvedCity?.id],
    queryFn: async () => {
      if (!query.trim()) return [];
      const today = new Date().toISOString().split("T")[0];
      const allEvents: any[] = [];

      let baseQuery = supabase
        .from("events")
        .select("*, cities!inner(slug, name)")
        .eq("status", "active")
        .gte("date_start", today);

      // If location specified, filter events to that city
      if (resolvedCity) {
        baseQuery = baseQuery.eq("city_id", resolvedCity.id);
      }

      // Title match
      const { data: titleMatches } = await baseQuery
        .ilike("title", `%${query.trim()}%`)
        .limit(12);
      if (titleMatches) allEvents.push(...titleMatches);

      // Text search
      const textTerms = intent.keywords.filter(w => w.length > 2);
      if (textTerms.length > 0) {
        const orClauses = textTerms
          .map(t => `title.ilike.%${t}%,short_description.ilike.%${t}%,venue_name.ilike.%${t}%`)
          .join(",");
        let q = supabase
          .from("events")
          .select("*, cities!inner(slug, name)")
          .eq("status", "active")
          .gte("date_start", today)
          .or(orClauses)
          .limit(12);
        if (resolvedCity) q = q.eq("city_id", resolvedCity.id);
        const { data } = await q;
        if (data) allEvents.push(...data);
      }

      // Tag-based search
      if (intent.categorySlugs.length > 0) {
        for (const tag of intent.categorySlugs.slice(0, 3)) {
          let q = supabase
            .from("events")
            .select("*, cities!inner(slug, name)")
            .eq("status", "active")
            .gte("date_start", today)
            .contains("tags", [tag])
            .limit(10);
          if (resolvedCity) q = q.eq("city_id", resolvedCity.id);
          const { data } = await q;
          if (data) allEvents.push(...data);
        }
      }

      // Deduplicate + score
      const seen = new Set<string>();
      const unique = allEvents.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      const scored = unique.map(item => ({
        item,
        score: scoreEvent(item, query, intent),
      }));
      return rankAndFilter(scored, 10, intent.hasExplicitLocation);
    },
    enabled: !!query && (intent.city ? resolvedCity !== undefined : true),
  });

  // Related programmatic pages
  const { data: relatedPages } = useQuery({
    queryKey: ["search-pages", query],
    queryFn: async () => {
      if (intent.suggestedPages.length === 0) return [];
      const { data } = await supabase
        .from("programmatic_pages")
        .select("slug, title, listing_count")
        .in("slug", intent.suggestedPages)
        .eq("is_active", true)
        .gt("listing_count", 0)
        .order("listing_count", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!query && intent.suggestedPages.length > 0,
  });

  const hasExactResults = rankedExact.length > 0;
  const hasNearbyResults = rankedNearby.length > 0;
  const hasEvents = eventResults && eventResults.length > 0;
  const hasRelatedPages = relatedPages && relatedPages.length > 0;
  const locationName = resolvedCity?.name || intent.city;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mb-8">
          <SearchBar large placeholder="Search venues, events, cities..." />
        </div>

        <h1 className="font-display font-bold text-2xl text-foreground mb-2">
          {query ? `Results for "${query}"` : "Search"}
        </h1>

        {query && (intent.categorySlugs.length > 0 || intent.hasExplicitLocation) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {intent.hasExplicitLocation && locationName && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {locationName}
              </span>
            )}
            {intent.categorySlugs.slice(0, 5).map((cat) => (
              <span key={cat} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {cat.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        )}

        {hasRelatedPages && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">Related pages</p>
            <div className="flex flex-wrap gap-2">
              {relatedPages!.map((page) => (
                <Link
                  key={page.slug}
                  to={`/${page.slug}`}
                  className="text-sm bg-card border border-border px-3 py-1.5 rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {page.title} ({page.listing_count})
                </Link>
              ))}
            </div>
          </div>
        )}

        {hasEvents && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-teal" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                {locationName ? `Upcoming Events in ${locationName}` : "Upcoming Events"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventResults!.map((event: any, i: number) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  slug={event.slug}
                  shortDescription={event.short_description}
                  dateStart={event.date_start}
                  dateEnd={event.date_end}
                  timeStart={event.time_start}
                  venueName={event.venue_name}
                  venueAddress={event.venue_address}
                  imageUrl={event.image_url}
                  imageSource={event.image_source}
                  imageAlt={event.image_alt}
                  imageStatus={event.image_status}
                  cityName={(event.cities as any)?.name}
                  isFree={event.is_free}
                  isFamilyFriendly={event.is_family_friendly}
                  ticketUrl={event.ticket_url}
                  price={event.price}
                  tags={event.tags || []}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          {isLoading
            ? "Searching..."
            : `${rankedExact.length} places found${locationName ? ` in ${locationName}` : ""}`}
        </p>

        {/* Exact location results */}
        {hasExactResults && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankedExact.map((listing: any, i: number) => (
              <ListingCard
                key={listing.id}
                name={listing.name}
                slug={listing.slug}
                citySlug={(listing.cities as any)?.slug || ""}
                shortDescription={listing.short_description || ""}
                rating={listing.rating}
                reviewCount={listing.review_count || 0}
                imageUrl={listing.image_url}
                imageSource={(listing as any).image_source}
                imageStatus={(listing as any).image_status}
                imageAlt={(listing as any).image_alt}
                categorySlug={(listing.categories as any)?.slug}
                categoryName={(listing.categories as any)?.name}
                cityName={(listing.cities as any)?.name}
                address={listing.address}
                priceLevel={listing.price_level}
                googleMapsLink={listing.google_maps_link}
                audienceTags={(listing as any).audience_tags}
                description={(listing as any).description}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Nearby fallback results — clearly labelled */}
        {hasNearbyResults && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                Showing nearby results close to {locationName}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedNearby.map((listing: any, i: number) => (
                <ListingCard
                  key={listing.id}
                  name={listing.name}
                  slug={listing.slug}
                  citySlug={(listing.cities as any)?.slug || ""}
                  shortDescription={listing.short_description || ""}
                  rating={listing.rating}
                  reviewCount={listing.review_count || 0}
                  imageUrl={listing.image_url}
                  imageSource={(listing as any).image_source}
                  imageStatus={(listing as any).image_status}
                  imageAlt={(listing as any).image_alt}
                  categorySlug={(listing.categories as any)?.slug}
                  categoryName={(listing.categories as any)?.name}
                  cityName={(listing.cities as any)?.name}
                  address={listing.address}
                  priceLevel={listing.price_level}
                  googleMapsLink={listing.google_maps_link}
                  audienceTags={(listing as any).audience_tags}
                  description={(listing as any).description}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        {/* Zero results */}
        {!isLoading && !hasExactResults && !hasNearbyResults && !hasEvents && query && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">
              {intent.hasExplicitLocation && locationName
                ? `No results found in ${locationName}. Try a broader search.`
                : "No exact matches found. Try one of these popular searches:"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "best restaurants Belfast",
                "things to do Belfast",
                "things to do Antrim",
                "markets Belfast",
                "events Belfast",
                "live music Derry",
              ].map((suggestion) => (
                <Link
                  key={suggestion}
                  to={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="text-sm bg-card border border-border px-3 py-1.5 rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
