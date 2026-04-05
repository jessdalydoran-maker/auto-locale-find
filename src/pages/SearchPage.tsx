import { useSearchParams, Link, useLocation } from "react-router-dom";
import { setPageCanonical } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { SearchBar } from "@/components/SearchBar";
import { parseSearchIntent } from "@/lib/search-intent";
import { scoreListing, scoreEvent, rankAndFilter, filterByCity } from "@/lib/search-scoring";
import { resolveIntentFilter, shouldExcludeListing } from "@/lib/category-filters";
import { Search, Calendar, MapPin } from "lucide-react";
import { deduplicateListings, filterCompleteListings } from "@/lib/page-validation";
import { filterAndRankListings } from "@/lib/listing-quality";
import { useMemo, useEffect } from "react";

const NEARBY_RADIUS_KM = 24; // ~15 miles
const STRICT_LOCAL_MIN_RESULTS = 6;
const DEFAULT_LOCAL_MIN_RESULTS = 5;
const THINGS_TO_DO_PRIORITY_SLUGS = [
  "things-to-do", "attractions", "cinemas", "theatre", "leisure-centres",
  "parks", "restaurants", "bars", "live-music", "family-activities",
  "shopping", "leisure-entertainment",
];

interface SearchPageProps {
  presetTown?: string;
  presetCategory?: string;
  presetQuery?: string;
  forceExactTownOnly?: boolean;
  headingMode?: "default" | "location";
  showSearchInput?: boolean;
}

const haversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
};

const slugToLabel = (value: string) =>
  value
    .split("-")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");

const SearchPage = ({
  presetTown,
  presetCategory,
  presetQuery,
  forceExactTownOnly = false,
  headingMode = "default",
  showSearchInput = true,
}: SearchPageProps) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const query = presetQuery ?? searchParams.get("q") ?? "";
  const townParam = presetTown ?? searchParams.get("town") ?? "";
  const categoryParam = presetCategory ?? searchParams.get("category") ?? "";
  const parsedIntent = parseSearchIntent(query);

  const intent = useMemo(() => {
    if (!townParam && !categoryParam) return parsedIntent;

    const overridden = { ...parsedIntent };

    if (townParam) {
      overridden.city = townParam;
      overridden.hasExplicitLocation = true;
      overridden.strictTownMode = true;
    }

    if (categoryParam) {
      const catSlugs = categoryParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (catSlugs.length > 0) {
        overridden.categorySlugs = catSlugs;
      }
    }

    return overridden;
  }, [parsedIntent, townParam, categoryParam]);

  const displayQuery = query || [
    categoryParam ? categoryParam.split(",")[0].replace(/-/g, " ") : "",
    townParam ? townParam.replace(/-/g, " ") : "",
  ].filter(Boolean).join(" in ") || "";

  const hasStructuredParams = !!townParam || !!categoryParam;

  // (SEO effect moved below resolvedCity declaration)

  const citySlugToResolve = intent.city;
  const { data: resolvedCity } = useQuery({
    queryKey: ["resolve-city", citySlugToResolve],
    queryFn: async () => {
      if (!citySlugToResolve) return null;

      // Try exact slug match first (most common for structured params)
      const { data: bySlug } = await supabase
        .from("cities")
        .select("id, slug, name, nearby_city_slugs, latitude, longitude")
        .eq("slug", citySlugToResolve)
        .maybeSingle();
      if (bySlug) return bySlug;

      // Fallback: case-insensitive name match (handles partial matches like "Ballymena, Northern Ireland")
      const townNameGuess = citySlugToResolve.replace(/-/g, " ");
      const { data: byName } = await supabase
        .from("cities")
        .select("id, slug, name, nearby_city_slugs, latitude, longitude")
        .ilike("name", `%${townNameGuess}%`)
        .limit(1)
        .maybeSingle();

      return byName;
    },
    enabled: !!citySlugToResolve,
    staleTime: 1000 * 60 * 10,
  });

  // Resolve nearby city IDs for fallback (10-15 mile radius, then configured nearby slugs)
  const { data: nearbyCities } = useQuery({
    queryKey: ["nearby-cities", resolvedCity?.id, resolvedCity?.latitude, resolvedCity?.longitude],
    queryFn: async () => {
      if (!resolvedCity?.id) return [];

      const nearby: Array<{ id: string; slug: string; name: string; distanceKm?: number }> = [];

      if (resolvedCity.latitude != null && resolvedCity.longitude != null) {
        const { data: citiesWithCoords } = await supabase
          .from("cities")
          .select("id, slug, name, latitude, longitude")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .neq("id", resolvedCity.id);

        if (citiesWithCoords?.length) {
          for (const city of citiesWithCoords) {
            const distanceKm = haversineDistanceKm(
              resolvedCity.latitude,
              resolvedCity.longitude,
              city.latitude,
              city.longitude
            );
            if (distanceKm <= NEARBY_RADIUS_KM) {
              nearby.push({ id: city.id, slug: city.slug, name: city.name, distanceKm });
            }
          }
        }
      }

      if (
        resolvedCity.nearby_city_slugs?.length &&
        (resolvedCity.latitude == null || resolvedCity.longitude == null || nearby.length === 0)
      ) {
        const { data: configuredNearby } = await supabase
          .from("cities")
          .select("id, slug, name")
          .in("slug", resolvedCity.nearby_city_slugs)
          .neq("id", resolvedCity.id);

        for (const city of configuredNearby || []) {
          if (!nearby.some((n) => n.id === city.id)) {
            nearby.push(city);
          }
        }
      }

      return nearby.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    },
    enabled: !!resolvedCity?.id,
    staleTime: 1000 * 60 * 10,
  });

  // SEO: set canonical, meta title and description for preset pages
  useEffect(() => {
    if (presetTown || presetCategory) {
      setPageCanonical(location.pathname);
      if (resolvedCity) {
        const catLabel = categoryParam ? slugToLabel(categoryParam.split(",")[0]) : "Things To Do";
        const isDefaultThingsToDo = !categoryParam || categoryParam === "things-to-do";
        document.title = isDefaultThingsToDo
          ? `Things to Do in ${resolvedCity.name} | City Scout Guide`
          : `Best ${catLabel} in ${resolvedCity.name} | City Scout Guide`;
        const desc = isDefaultThingsToDo
          ? `Discover the best things to do in ${resolvedCity.name}. Browse restaurants, pubs, events, live music, family activities and more.`
          : `Find the best ${catLabel.toLowerCase()} in ${resolvedCity.name}. Curated listings with ratings, reviews, and directions.`;
        let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
        meta.content = desc;
      }
      return;
    }
    setPageCanonical(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  }, [location.pathname, presetTown, presetCategory, query, resolvedCity, categoryParam]);

  // Main listings query — strict location-first hierarchy
  const { data: rawListings, isLoading } = useQuery({
    queryKey: [
      "search",
      query,
      townParam,
      categoryParam,
      resolvedCity?.id,
      nearbyCities?.map((c) => c.id).join(","),
      intent.strictTownMode,
      intent.intentLabel,
    ],
    queryFn: async () => {
      if (!query.trim() && !hasStructuredParams) return { exact: [] as any[], nearby: [] as any[], niWide: [] as any[] };
      if (intent.hasExplicitLocation && !resolvedCity && !hasStructuredParams) {
        return { exact: [] as any[], nearby: [] as any[], niWide: [] as any[] };
      }

      const selectFields = "*, cities!inner(slug, name), categories!inner(slug, name)";
      const exactResults: any[] = [];
      const nearbyResults: any[] = [];
      const niWideResults: any[] = [];

      // Use the shared category filter system
      const catFilter = resolveIntentFilter(intent.categorySlugs);
      const effectiveCategorySlugs = catFilter.includeSlugs;

      const { data: categoryRows } = effectiveCategorySlugs.length
        ? await supabase
            .from("categories")
            .select("id, slug")
            .in("slug", effectiveCategorySlugs)
        : { data: [] as Array<{ id: string; slug: string }> };
      const categoryIds = (categoryRows || []).map((c) => c.id);

      // Resolve exclude category IDs for strict filtering
      let excludeCategoryIds: string[] = [];
      if (catFilter.excludeSlugs.length > 0) {
        const { data: excludeRows } = await supabase
          .from("categories")
          .select("id, slug")
          .in("slug", catFilter.excludeSlugs);
        excludeCategoryIds = (excludeRows || []).map((c) => c.id);
      }

      const isSpecificCategory = !catFilter.isBroadIntent;

      async function fetchForCities(cityIds: string[] | null, limit: number) {
        const results: any[] = [];

        const applyCityFilter = <T,>(queryBuilder: T) => {
          if (cityIds && cityIds.length > 0) {
            return (queryBuilder as any).in("city_id", cityIds);
          }
          return queryBuilder;
        };

        // For specific categories, ALL queries must be constrained to allowed categories
        const applyCategoryGuard = <T,>(queryBuilder: T) => {
          if (isSpecificCategory && categoryIds.length > 0) {
            return (queryBuilder as any).in("category_id", categoryIds);
          }
          return queryBuilder;
        };

        // Primary: category-matched listings
        if (categoryIds.length > 0) {
          let categoryQuery = supabase
            .from("listings")
            .select(selectFields)
            .in("category_id", categoryIds)
            .order("rating", { ascending: false })
            .limit(limit);
          categoryQuery = applyCityFilter(categoryQuery);
          const { data } = await categoryQuery;
          if (data) results.push(...data);
        }

        // Audience tag query (always category-guarded for specific intents)
        if (catFilter.audienceTags.length > 0) {
          for (const tag of catFilter.audienceTags.slice(0, 4)) {
            let audienceQuery = supabase
              .from("listings")
              .select(selectFields)
              .contains("audience_tags", [tag])
              .limit(Math.ceil(limit / 2));
            audienceQuery = applyCityFilter(audienceQuery);
            // Don't category-guard audience tags — they ARE the filter for cross-category matches
            const { data } = await audienceQuery;
            if (data) results.push(...data);
          }
        } else if (!isSpecificCategory) {
          for (const tag of intent.categorySlugs.slice(0, 3)) {
            let audienceQuery = supabase
              .from("listings")
              .select(selectFields)
              .contains("audience_tags", [tag])
              .limit(Math.ceil(limit / 2));
            audienceQuery = applyCityFilter(audienceQuery);
            const { data } = await audienceQuery;
            if (data) results.push(...data);
          }
        }

        // Keyword text query — MUST be category-guarded for specific intents
        const textTerms = intent.keywords.filter((w) => w.length > 2);
        if (textTerms.length > 0 && !isSpecificCategory) {
          const orClauses = textTerms
            .map((t) => `name.ilike.%${t}%,short_description.ilike.%${t}%,description.ilike.%${t}%`)
            .join(",");
          let keywordQuery = supabase
            .from("listings")
            .select(selectFields)
            .or(orClauses)
            .limit(limit);
          keywordQuery = applyCityFilter(keywordQuery);
          const { data } = await keywordQuery;
          if (data) results.push(...data);
        }

        // Venue name query — category-guarded for specific intents
        if (query.trim().length > 2) {
          let nameQuery = supabase
            .from("listings")
            .select(selectFields)
            .ilike("name", `%${query.trim()}%`)
            .limit(Math.ceil(limit / 2));
          nameQuery = applyCityFilter(nameQuery);
          nameQuery = applyCategoryGuard(nameQuery);
          const { data: nameMatches } = await nameQuery;
          if (nameMatches) results.push(...nameMatches);
        }

        // ONLY for broad intents or no-category, show top-rated as fallback
        if (catFilter.isBroadIntent || (categoryIds.length === 0 && catFilter.audienceTags.length === 0)) {
          if (results.length < 8) {
            let topRatedQuery = supabase
              .from("listings")
              .select(selectFields)
              .order("rating", { ascending: false })
              .limit(limit);
            topRatedQuery = applyCityFilter(topRatedQuery);
            const { data } = await topRatedQuery;
            if (data) results.push(...data);
          }
        }

        // Post-fetch: exclude listings from excluded categories
        if (excludeCategoryIds.length > 0) {
          return results.filter((item) => !excludeCategoryIds.includes(item.category_id));
        }

        return results;
      }

      const largeResultMode = intent.hasExplicitLocation && (intent.categorySlugs.length > 0 || hasStructuredParams);
      const exactFetchLimit = largeResultMode ? 180 : 40;
      const nearbyFetchLimit = largeResultMode ? 40 : 15;

      if (resolvedCity) {
        const tier1 = await fetchForCities([resolvedCity.id], exactFetchLimit);
        exactResults.push(...tier1);

        const minimumLocalThreshold = isSpecificCategory
          ? STRICT_LOCAL_MIN_RESULTS
          : intent.strictTownMode
            ? STRICT_LOCAL_MIN_RESULTS
            : DEFAULT_LOCAL_MIN_RESULTS;

        // For specific categories with few local results, show nearby even on preset pages
        const shouldShowNearby = !forceExactTownOnly || (isSpecificCategory && exactResults.length < minimumLocalThreshold);
        if (shouldShowNearby && exactResults.length < minimumLocalThreshold && nearbyCities?.length) {
          const nearbyIds = nearbyCities.map((c) => c.id);
          const tier2 = await fetchForCities(nearbyIds, nearbyFetchLimit);
          nearbyResults.push(...tier2);
        }

        if (!forceExactTownOnly && !intent.strictTownMode && exactResults.length + nearbyResults.length < 3) {
          const excludeIds = [resolvedCity.id, ...(nearbyCities?.map((c) => c.id) || [])];
          const textTerms = intent.keywords.filter((w) => w.length > 2);

          if (categoryIds.length > 0) {
            const { data } = await supabase
              .from("listings")
              .select(selectFields)
              .in("category_id", categoryIds)
              .order("rating", { ascending: false })
              .limit(24);
            if (data) niWideResults.push(...data.filter((d) => !excludeIds.includes(d.city_id)));
          } else if (textTerms.length > 0) {
            const orClauses = textTerms
              .map((t) => `name.ilike.%${t}%,short_description.ilike.%${t}%,description.ilike.%${t}%`)
              .join(",");
            const { data } = await supabase.from("listings").select(selectFields).or(orClauses).limit(24);
            if (data) niWideResults.push(...data.filter((d) => !excludeIds.includes(d.city_id)));
          }
        }
      } else {
        const broadResults = await fetchForCities(null, 60);
        exactResults.push(...broadResults);
      }

      // "Other popular places" fallback — unfiltered top-rated for the town
      // Only when a specific category yields few results
      let otherPopular: any[] = [];
      if (isSpecificCategory && resolvedCity && exactResults.length < 10) {
        const { data: topLocal } = await supabase
          .from("listings")
          .select(selectFields)
          .eq("city_id", resolvedCity.id)
          .order("rating", { ascending: false })
          .limit(12);
        if (topLocal) {
          const exactIds = new Set(exactResults.map((r) => r.id));
          otherPopular = topLocal.filter((item) => !exactIds.has(item.id));
        }
      }

      const seenIds = new Set<string>();
      const dedup = (arr: any[]) =>
        arr.filter((item) => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });

      return {
        exact: dedup(exactResults),
        nearby: dedup(nearbyResults),
        niWide: dedup(niWideResults),
        otherPopular: dedup(otherPopular),
      };
    },
    enabled: (!!query || hasStructuredParams) && (intent.city ? resolvedCity !== undefined : true),
  });

  // Score and rank listings across all 3 tiers
  const { rankedExact, rankedNearby, rankedNiWide } = useMemo(() => {
    if (!rawListings) return { rankedExact: [], rankedNearby: [], rankedNiWide: [] };

    const { matched: cityMatchedExact } = filterByCity(rawListings.exact, intent.city);
    const exactSource = intent.hasExplicitLocation ? cityMatchedExact : rawListings.exact;
    const nearbySource = forceExactTownOnly
      ? []
      : intent.city
        ? rawListings.nearby.filter((item: any) => (item.cities as any)?.slug !== intent.city)
        : rawListings.nearby;
    const niWideSource = forceExactTownOnly || intent.strictTownMode ? [] : rawListings.niWide;

    const scoredExact = exactSource.map((item: any) => ({
      item,
      score: scoreListing(item, query, intent),
    }));
    const exact = rankAndFilter(scoredExact, 20, intent.hasExplicitLocation);
    const { unique: uniqueExact } = deduplicateListings(exact as any);
    const filteredExact = filterAndRankListings(filterCompleteListings(uniqueExact) as any);

    const scoredNearby = nearbySource.map((item: any) => ({
      item,
      score: scoreListing(item, query, { ...intent, city: null, hasExplicitLocation: false }),
    }));
    const nearby = rankAndFilter(scoredNearby, 20, false);
    const { unique: uniqueNearby } = deduplicateListings(nearby as any);
    const filteredNearby = filterAndRankListings(filterCompleteListings(uniqueNearby) as any);

    const scoredNiWide = niWideSource.map((item: any) => ({
      item,
      score: scoreListing(item, query, { ...intent, city: null, hasExplicitLocation: false }),
    }));
    const niWide = rankAndFilter(scoredNiWide, 20, false);
    const { unique: uniqueNiWide } = deduplicateListings(niWide as any);
    const filteredNiWide = filterAndRankListings(filterCompleteListings(uniqueNiWide) as any);

    return { rankedExact: filteredExact, rankedNearby: filteredNearby, rankedNiWide: filteredNiWide };
  }, [rawListings, query, intent, forceExactTownOnly]);

  // Search events — strict location-first (same 3-tier hierarchy)
  const { data: eventResults } = useQuery({
    queryKey: ["search-events", query, townParam, categoryParam, resolvedCity?.id, nearbyCities?.map(c => c.id).join(","), intent.strictTownMode],
    queryFn: async () => {
      if (!query.trim() && !hasStructuredParams) return { local: [] as any[], nearby: [] as any[] };
      if (intent.hasExplicitLocation && !resolvedCity) {
        return { local: [] as any[], nearby: [] as any[] };
      }
      const today = new Date().toISOString().split("T")[0];

      async function fetchEventsForCities(cityIds: string[] | null, limit: number) {
        const results: any[] = [];

        // Title match (only when there's a text query)
        if (query.trim()) {
          let q1 = supabase
            .from("events")
            .select("*, cities!inner(slug, name)")
            .eq("status", "active")
            .gte("date_start", today)
            .ilike("title", `%${query.trim()}%`)
            .limit(limit);
          if (cityIds) q1 = q1.in("city_id", cityIds);
          const { data: d1 } = await q1;
          if (d1) results.push(...d1);
        }

        // Tag-based
        if (intent.categorySlugs.length > 0) {
          for (const tag of intent.categorySlugs.slice(0, 3)) {
            let q = supabase
              .from("events")
              .select("*, cities!inner(slug, name)")
              .eq("status", "active")
              .gte("date_start", today)
              .contains("tags", [tag])
              .limit(Math.ceil(limit / 2));
            if (cityIds) q = q.in("city_id", cityIds);
            const { data } = await q;
            if (data) results.push(...data);
          }
        }

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
            .limit(limit);
          if (cityIds) q = q.in("city_id", cityIds);
          const { data } = await q;
          if (data) results.push(...data);
        }

        // For generic "events" / "things to do" queries, show upcoming events
        if (results.length === 0 && (intent.categorySlugs.includes("events") || intent.categorySlugs.includes("things-to-do") || intent.categorySlugs.length === 0)) {
          let q = supabase
            .from("events")
            .select("*, cities!inner(slug, name)")
            .eq("status", "active")
            .gte("date_start", today)
            .order("date_start", { ascending: true })
            .limit(limit);
          if (cityIds) q = q.in("city_id", cityIds);
          const { data } = await q;
          if (data) results.push(...data);
        }

        return results;
      }

      const localEvents: any[] = [];
      const nearbyEvents: any[] = [];

      if (resolvedCity) {
        const tier1 = await fetchEventsForCities([resolvedCity.id], 30);
        localEvents.push(...tier1);

        const minimumLocalThreshold = intent.strictTownMode
          ? STRICT_LOCAL_MIN_RESULTS
          : DEFAULT_LOCAL_MIN_RESULTS;

        if (!forceExactTownOnly && localEvents.length < minimumLocalThreshold && nearbyCities?.length) {
          const nearbyIds = nearbyCities.map(c => c.id);
          const tier2 = await fetchEventsForCities(nearbyIds, 14);
          nearbyEvents.push(...tier2);
        }
      } else {
        const broad = await fetchEventsForCities(null, 20);
        localEvents.push(...broad);
      }

      const seen = new Set<string>();
      const dedup = (arr: any[]) => arr.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      const dedupLocal = dedup(localEvents);
      const { matched: cityMatchedLocal } = filterByCity(dedupLocal, intent.city);
      const localSource = intent.hasExplicitLocation ? cityMatchedLocal : dedupLocal;
      const nearbySource = forceExactTownOnly
        ? []
        : intent.city
          ? dedup(nearbyEvents).filter((item: any) => (item.cities as any)?.slug !== intent.city)
          : dedup(nearbyEvents);

      const scoredLocal = localSource.map((item: any) => ({
        item,
        score: scoreEvent(item, query, intent),
      }));
      const scoredNearby = nearbySource.map((item: any) => ({
        item,
        score: scoreEvent(item, query, { ...intent, city: null, hasExplicitLocation: false }),
      }));

      return {
        local: rankAndFilter(scoredLocal, 10, intent.hasExplicitLocation),
        nearby: rankAndFilter(scoredNearby, 10, false),
      };
    },
    enabled: (!!query || hasStructuredParams) && (intent.city ? resolvedCity !== undefined : true),
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

  const localEvents = eventResults?.local || [];
  const nearbyEvents = eventResults?.nearby || [];
  const otherPopular = rawListings?.otherPopular || [];
  const hasExactResults = rankedExact.length > 0;
  const hasNearbyResults = rankedNearby.length > 0;
  const hasNiWideResults = rankedNiWide.length > 0;
  const hasOtherPopular = otherPopular.length > 0;
  const hasLocalEvents = localEvents.length > 0;
  const hasNearbyEvents = nearbyEvents.length > 0;
  const hasRelatedPages = relatedPages && relatedPages.length > 0;
  const locationName = resolvedCity?.name || intent.city;
  const hasAnyResults = hasExactResults || hasNearbyResults || hasNiWideResults || hasLocalEvents || hasNearbyEvents;
  const primaryCategorySlug = (categoryParam.split(",").find(Boolean) || intent.categorySlugs[0] || "things-to-do").toLowerCase();
  const primaryCategoryLabel = slugToLabel(primaryCategorySlug);
  const locationHeading = locationName
    ? `${slugToLabel(primaryCategorySlug)} in ${locationName}`
    : slugToLabel(primaryCategorySlug);
  const pageHeading = headingMode === "location" && hasStructuredParams
    ? locationHeading
    : displayQuery
      ? `Results for "${displayQuery}"`
      : "Search";

  // Helper to render a listing card
  const renderListingCard = (listing: any, i: number) => (
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
  );

  const renderEventCard = (event: any, i: number) => (
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
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {showSearchInput && (
          <div className="max-w-xl mb-8">
            <SearchBar large placeholder="Search venues, events, cities..." />
          </div>
        )}

        <h1 className="font-display font-bold text-2xl text-foreground mb-2">
          {pageHeading}
        </h1>

        {/* SEO intro paragraph for town / town+category pages */}
        {headingMode === "location" && locationName && (
          <p className="text-muted-foreground text-sm mb-4 max-w-2xl leading-relaxed">
            {(() => {
              const catSlug = (categoryParam || "things-to-do").split(",")[0];
              const isDefault = catSlug === "things-to-do";
              if (isDefault) {
                return `Discover the best things to do in ${locationName}. From top-rated restaurants and pubs to live music, family activities and local events — browse our curated guide to ${locationName}.`;
              }
              const catName = slugToLabel(catSlug);
              return `Looking for ${catName.toLowerCase()} in ${locationName}? Browse our curated selection of the best ${catName.toLowerCase()}, all rated and reviewed by locals.`;
            })()}
          </p>
        )}

        {(query || hasStructuredParams) && (intent.categorySlugs.length > 0 || intent.hasExplicitLocation) && (
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

        {/* Local events — Tier 1 */}
        {hasLocalEvents && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-teal" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                {locationName ? `Upcoming Events in ${locationName}` : "Upcoming Events"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {localEvents.map(renderEventCard)}
            </div>
          </section>
        )}

        {/* Nearby events — Tier 2 */}
        {hasNearbyEvents && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                Nearby to {locationName}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyEvents.map(renderEventCard)}
            </div>
          </section>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          {isLoading
            ? "Searching..."
            : `${rankedExact.length} places found${locationName ? ` in ${locationName}` : ""}`}
        </p>

        {/* Exact location results — Tier 1 */}
        {hasExactResults && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankedExact.map(renderListingCard)}
          </div>
        )}

        {/* Nearby fallback results — Tier 2 */}
        {hasNearbyResults && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                More {primaryCategoryLabel} near {locationName}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedNearby.map(renderListingCard)}
            </div>
          </section>
        )}

        {/* NI-wide results — Tier 3 */}
        {hasNiWideResults && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                More results across Northern Ireland
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedNiWide.map(renderListingCard)}
            </div>
          </section>
        )}

        {/* Other popular places — separate from filtered results */}
        {hasOtherPopular && (
          <section className="mt-10 pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                Other popular places in {locationName}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPopular.map(renderListingCard)}
            </div>
          </section>
        )}

        {/* Zero results */}
        {!isLoading && !hasAnyResults && (query || hasStructuredParams) && (
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
