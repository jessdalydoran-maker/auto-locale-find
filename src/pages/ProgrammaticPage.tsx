import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { LandmarkMap } from "@/components/LandmarkMap";
import { MapPin, ChevronRight, Calendar, Filter, ArrowRight, AlertCircle } from "lucide-react";
import {
  parseSlug,
  generateTitle,
  generateMetaDescription,
  generateIntroText,
  buildPageUrl,
  formatTimeIntent,
  getTimeIntentDateRange,
  isEventCategory,
  generateFaqItems,
} from "@/lib/seo-utils";
import {
  getCityClusters,
  getNeighbourhoodCluster,
  getLandmarkCluster,
  getSiblingPages,
  getCrossClusterLinks,
} from "@/lib/seo-clusters";
import {
  meetsContentThreshold,
  isThinContent,
  getCanonicalSlug,
} from "@/lib/content-quality";
import { useEffect, useMemo, useState } from "react";

const ProgrammaticPage = () => {
  const { "*": rawSlug } = useParams();
  const slug = rawSlug || "";

  // Fetch lookup data
  const { data: cities } = useQuery({
    queryKey: ["all-cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("id, name, slug");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: neighbourhoods } = useQuery({
    queryKey: ["all-neighbourhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighbourhoods")
        .select("id, name, slug, description, city_id, cities!inner(slug)")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: allCategories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: modifiers } = useQuery({
    queryKey: ["all-modifiers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modifiers").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch landmarks
  const { data: landmarks } = useQuery({
    queryKey: ["all-landmarks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("landmarks").select("*");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Parse slug
  const parsed = useMemo(() => {
    if (!cities || !neighbourhoods) return null;
    const citySlugs = cities.map((c) => c.slug);
    const nbSlugs = neighbourhoods.map((n) => ({
      slug: n.slug,
      citySlug: (n.cities as any)?.slug || "",
    }));
    return parseSlug(slug, citySlugs, nbSlugs);
  }, [slug, cities, neighbourhoods]);

  // Resolve entities
  // For NI-wide pages, create a virtual city object so all downstream logic works
  const city = useMemo(() => {
    if (parsed?.citySlug === "northern-ireland") {
      return { id: "ni-wide", name: "Northern Ireland", slug: "northern-ireland" } as any;
    }
    return cities?.find((c) => c.slug === parsed?.citySlug);
  }, [cities, parsed]);
  const category = useMemo(() => allCategories?.find((c) => c.slug === parsed?.categorySlug), [allCategories, parsed]);
  const modifier = useMemo(() => modifiers?.find((m) => m.slug === parsed?.modifierSlug), [modifiers, parsed]);
  const neighbourhood = useMemo(
    () => neighbourhoods?.find((n) => n.slug === parsed?.neighbourhoodSlug && (n.cities as any)?.slug === parsed?.citySlug),
    [neighbourhoods, parsed]
  );

  // Resolve landmark
  const landmark = useMemo(() => {
    if (!parsed?.nearLandmark || !landmarks) return null;
    return landmarks.find((l) => l.slug === parsed.nearLandmark) || null;
  }, [parsed, landmarks]);

  const isLandmarkPage = !!parsed?.nearLandmark && !!landmark;
  const isNIWide = parsed?.citySlug === "northern-ireland";
  const locationName = isLandmarkPage ? landmark!.name : isNIWide ? "Northern Ireland" : (neighbourhood?.name || city?.name || "");
  const cityName = (neighbourhood || isLandmarkPage) ? city?.name : undefined;
  const showEvents = parsed ? isEventCategory(parsed.categorySlug) : false;
  const isWeekendPage = parsed?.categorySlug === "things-to-do" && !!parsed?.timeIntent;
  const dateRange = parsed ? getTimeIntentDateRange(parsed.timeIntent || null) : null;
  const currentUrl = "/" + slug;

  // Location filter state for NI-wide pages
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  // NI cities for location filter
  const niCities = useMemo(() => {
    if (!cities) return [];
    const NI_SLUGS = ["belfast", "derry", "lisburn", "antrim", "bangor", "newry", "armagh", 
      "newtownabbey", "ballymena", "coleraine", "cookstown", "craigavon", "enniskillen", 
      "omagh", "strabane", "downpatrick", "banbridge", "causeway-coast", "county-down"];
    return cities.filter(c => NI_SLUGS.includes(c.slug)).sort((a, b) => a.name.localeCompare(b.name));
  }, [cities]);

  // Clusters
  const clusters = useMemo(() => {
    if (!city || !neighbourhoods) return [];
    const cityClusters = getCityClusters(city.slug, city.name);
    const cityNbs = neighbourhoods
      .filter((n) => (n.cities as any)?.slug === city.slug)
      .map((n) => ({ name: n.name, slug: n.slug }));
    if (cityNbs.length > 0) {
      cityClusters.push(getNeighbourhoodCluster(city.slug, city.name, cityNbs));
    }
    // Add landmark cluster
    if (landmarks && landmarks.length > 0) {
      const cityLandmarks = landmarks
        .filter((l) => l.city_id === city.id)
        .map((l) => ({ name: l.name, slug: l.slug }));
      if (cityLandmarks.length > 0) {
        cityClusters.push(getLandmarkCluster(city.slug, city.name, cityLandmarks));
      }
    }
    return cityClusters;
  }, [city, neighbourhoods, landmarks]);

  const siblingPages = useMemo(() => getSiblingPages(currentUrl, clusters), [currentUrl, clusters]);
  const crossClusterLinks = useMemo(() => getCrossClusterLinks(currentUrl, clusters), [currentUrl, clusters]);

  // Fetch nearby listings (for landmark pages)
  const { data: nearbyListings } = useQuery({
    queryKey: ["nearby-listings", landmark?.id, parsed?.categorySlug],
    queryFn: async () => {
      const catSlug = parsed!.categorySlug === "things-to-do" ? null : parsed!.categorySlug;
      const { data, error } = await supabase.rpc("nearby_listings", {
        p_lat: landmark!.latitude,
        p_lng: landmark!.longitude,
        p_radius_km: landmark!.radius_km,
        p_category_slug: catSlug,
        p_limit: 20,
      });
      if (error) throw error;
      // Need to fetch categories for each listing
      if (!data || data.length === 0) return [];
      const ids = data.map((l: any) => l.id);
      const { data: enriched } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .in("id", ids)
        .order("rating", { ascending: false });
      return enriched || [];
    },
    enabled: isLandmarkPage && !showEvents,
  });

  // Determine if this is a family-oriented page
  const isFamilyPage = parsed?.modifierSlug === "family";
  // Determine if this is a date-night page (can be either modifier or category slug)
  const isDateNightPage = parsed?.modifierSlug === "date-night" || parsed?.modifierSlug === "romantic" || parsed?.categorySlug === "date-night";

  // Categories to exclude for family pages
  const FAMILY_EXCLUDED_CATEGORIES = ["bars", "cocktail-bars", "nightlife", "late-night", "pubs"];
  const FAMILY_EXCLUDED_TAGS = ["nightlife", "late-night", "cocktails", "romantic", "adults-only"];
  // Only allow fallback categories that are inherently family-suitable (not restaurants/cafes/generic)
  const FAMILY_FALLBACK_CATEGORIES = ["parks", "museums", "zoos", "science-centres", "indoor-play", "leisure-centres", "activity-centres"];

  // Date night relevant categories and tags
  const DATE_NIGHT_CATEGORIES = ["bars", "cocktail-bars", "restaurants", "nightlife", "pubs", "wine-bars"];
  const DATE_NIGHT_EVENT_TAGS = ["theatre", "comedy", "live-music", "cinema", "film", "date-night", "jazz", "cabaret", "music", "art", "exhibitions", "nightlife", "cocktails"];
  const DATE_NIGHT_EXCLUDED_TAGS = ["kids", "family", "workshop", "workshops", "craft"];

  // Fetch regular listings (non-landmark pages)
  const { data: regularListings } = useQuery({
    queryKey: ["prog-listings", parsed?.categorySlug, parsed?.citySlug, parsed?.neighbourhoodSlug, parsed?.modifierSlug, locationFilter, isDateNightPage],
    queryFn: async () => {
      const fetchLimit = (isFamilyPage || isDateNightPage) && isNIWide ? 200 : 30;

      // For date-night pages, fetch broadly across all categories then filter client-side
      if (isDateNightPage) {
        let dnQuery = supabase
          .from("listings")
          .select("*, cities!inner(slug, name), categories!inner(slug, name)")
          .eq("is_approved", true)
          .order("rating", { ascending: false })
          .limit(fetchLimit);

        if (isNIWide) {
          if (locationFilter) {
            dnQuery = dnQuery.eq("cities.slug", locationFilter);
          }
        } else {
          dnQuery = dnQuery.eq("cities.slug", parsed!.citySlug);
        }

        if (parsed?.neighbourhoodSlug && neighbourhood) {
          dnQuery = dnQuery.eq("neighbourhood_id", neighbourhood.id);
        }

        const { data: dnData, error: dnErr } = await dnQuery;
        if (dnErr) throw dnErr;

        let results = dnData || [];

        // Filter for date-night-relevant listings
        results = results.filter((l: any) => {
          const catSlug = (l.categories as any)?.slug || "";
          const tags: string[] = l.audience_tags || [];
          const name = l.name?.toLowerCase() || "";

          // Include if category matches date night categories
          if (DATE_NIGHT_CATEGORIES.includes(catSlug)) return true;

          // Include if tagged date-night or romantic
          if (tags.includes("date-night") || tags.includes("romantic") || tags.includes("cocktails") || tags.includes("wine")) return true;

          // Include restaurants (evening dining, not fast food/cafes)
          if (catSlug === "restaurants" || catSlug === "fine-dining") {
            // Exclude fast food signals
            if (name.includes("mcdonald") || name.includes("kfc") || name.includes("subway") || name.includes("chip")) return false;
            return true;
          }

          // Include venues with relevant names
          if (name.includes("cocktail") || name.includes("wine bar") || name.includes("jazz") || name.includes("lounge")) return true;

          // Exclude kids/family-only
          if (tags.includes("kids") || tags.includes("family")) return false;

          return false;
        });

        // Priority sort for date night
        const DATE_NIGHT_CATEGORY_PRIORITY: Record<string, number> = {
          "cocktail-bars": 10, "wine-bars": 9, "bars": 7, "nightlife": 6,
          "restaurants": 5, "fine-dining": 8, "pubs": 3,
        };

        results.sort((a: any, b: any) => {
          const aCat = (a.categories as any)?.slug || "";
          const bCat = (b.categories as any)?.slug || "";
          const aScore = (DATE_NIGHT_CATEGORY_PRIORITY[aCat] || 0) + ((a.rating || 0) * 0.5);
          const bScore = (DATE_NIGHT_CATEGORY_PRIORITY[bCat] || 0) + ((b.rating || 0) * 0.5);
          return bScore - aScore;
        });

        return results.slice(0, 40);
      }

      let query = supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("is_approved", true)
        .order("rating", { ascending: false })
        .limit(isFamilyPage && isNIWide ? 100 : 30);

      // For NI-wide pages, don't filter by city unless locationFilter is set
      if (isNIWide) {
        if (locationFilter) {
          query = query.eq("cities.slug", locationFilter);
        }
      } else {
        query = query.eq("cities.slug", parsed!.citySlug);
      }

      if (parsed!.categorySlug !== "things-to-do" && parsed!.categorySlug !== "indoor-activities" && !showEvents) {
        query = query.eq("categories.slug", parsed!.categorySlug);
      }

      if (parsed?.neighbourhoodSlug && neighbourhood) {
        query = query.eq("neighbourhood_id", neighbourhood.id);
      }

      if (parsed?.modifierSlug === "free") {
        query = query.eq("price_level", "Free");
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data || [];

      if (isFamilyPage) {
        let familyQuery = supabase
          .from("listings")
          .select("*, cities!inner(slug, name), categories!inner(slug, name)")
          .eq("is_approved", true)
          .order("rating", { ascending: false })
          .limit(200);

        if (isNIWide) {
          if (locationFilter) {
            familyQuery = familyQuery.eq("cities.slug", locationFilter);
          }
        } else {
          familyQuery = familyQuery.eq("cities.slug", parsed!.citySlug);
        }

        const { data: familyData } = await familyQuery;
        if (familyData) {
          results = familyData;
        }

        results = results.filter((l: any) => {
          const tags: string[] = (l as any).audience_tags || [];
          const catSlug = (l.categories as any)?.slug || "";
          const isFamilyTagged = tags.includes("family") || tags.includes("kids") || (l as any).family_friendly === true || (l as any).kids_friendly === true;
          if (FAMILY_EXCLUDED_CATEGORIES.includes(catSlug)) return false;
          if (tags.some((t: string) => FAMILY_EXCLUDED_TAGS.includes(t))) return false;
          return isFamilyTagged;
        });

        results.sort((a: any, b: any) => {
          const aTags: string[] = a.audience_tags || [];
          const bTags: string[] = b.audience_tags || [];
          const aFam = aTags.includes("family");
          const aKids = aTags.includes("kids");
          const aFF = (a as any).family_friendly === true;
          const bFam = bTags.includes("family");
          const bKids = bTags.includes("kids");
          const bFF = (b as any).family_friendly === true;
          const aScore = (aFam && aKids ? 4 : 0) + (aFam ? 2 : 0) + (aKids ? 1 : 0) + (aFF ? 0.5 : 0);
          const bScore = (bFam && bKids ? 4 : 0) + (bFam ? 2 : 0) + (bKids ? 1 : 0) + (bFF ? 0.5 : 0);
          return bScore - aScore;
        });

        results = results.slice(0, 30);
      }

      return results;
    },
    enabled: !!parsed?.citySlug && !!parsed?.categorySlug && !showEvents && !isLandmarkPage,
  });

  const listings = isLandmarkPage ? nearbyListings : regularListings;

  // Fetch venue listings for event-category pages (live-music, theatre, comedy etc)
  // so we show both events AND related venues
  const VENUE_CATEGORY_MAP: Record<string, string[]> = {
    "live-music": ["bars", "nightlife", "live-music"],
    "theatre": ["theatre", "attractions"],
    "comedy": ["comedy", "bars", "nightlife"],
    "exhibitions": ["exhibitions", "museums", "attractions"],
    "markets": ["markets"],
    "festivals": ["festivals", "attractions"],
  };

  const venueCategories = showEvents && parsed?.categorySlug ? VENUE_CATEGORY_MAP[parsed.categorySlug] || [] : [];

  const { data: venueListings } = useQuery({
    queryKey: ["venue-listings", parsed?.categorySlug, parsed?.citySlug, locationFilter],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("is_approved", true)
        .order("rating", { ascending: false })
        .limit(30);

      if (isNIWide) {
        if (locationFilter) {
          query = query.eq("cities.slug", locationFilter);
        }
      } else {
        query = query.eq("cities.slug", parsed!.citySlug);
      }

      // For live-music, include bars that host live music
      if (parsed?.categorySlug === "live-music") {
        query = query.or(`categories.slug.in.(${venueCategories.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data || [];

      // For live-music, also include bars with music-related names/descriptions
      if (parsed?.categorySlug === "live-music") {
        results = results.filter((l: any) => {
          const catSlug = (l.categories as any)?.slug || "";
          const name = l.name?.toLowerCase() || "";
          const desc = (l.short_description || l.description || "").toLowerCase();
          const tags: string[] = l.audience_tags || [];

          // Direct category match
          if (["live-music", "nightlife"].includes(catSlug)) return true;

          // Bars that have music signals
          if (catSlug === "bars") {
            if (name.includes("music") || name.includes("empire") || name.includes("limelight") ||
                name.includes("front page") || name.includes("sunflower") || name.includes("voodoo") ||
                name.includes("filthy") || name.includes("mandela") || name.includes("lavery") ||
                name.includes("errigle") || name.includes("botanic") || name.includes("harp")) return true;
            if (desc.includes("music") || desc.includes("live") || desc.includes("gig") || desc.includes("band")) return true;
            if (tags.includes("live-music") || tags.includes("music")) return true;
            // Include all bars as potential music venues (many NI bars host live music)
            return true;
          }

          return false;
        });
      }

      return results;
    },
    enabled: venueCategories.length > 0 && !!parsed?.citySlug,
  });

  // Fetch events (for event pages, weekend pages, family/free/date-night pages)
  const shouldFetchEvents = showEvents || isWeekendPage || isDateNightPage ||
    (parsed?.modifierSlug === "family" && parsed?.categorySlug === "things-to-do") ||
    (parsed?.modifierSlug === "free" && parsed?.categorySlug === "things-to-do");

  // Family event tag priority scoring
  const FAMILY_EVENT_PRIORITY_TAGS: Record<string, number> = {
    "workshop": 10, "workshops": 10, "kids": 9, "family": 8,
    "theatre": 7, "dance": 7, "literature": 7,
    "festival": 6, "outdoor": 5, "art": 5, "exhibitions": 5,
    "music": 4, "community": 4, "heritage": 3, "market": 3,
  };
  const FAMILY_EVENT_DEPRIORITY_TAGS = ["sport", "boxing", "nightlife", "concerts"];

  const { data: rawEvents } = useQuery({
    queryKey: ["prog-events", parsed?.categorySlug, parsed?.citySlug, parsed?.neighbourhoodSlug, parsed?.timeIntent, parsed?.modifierSlug, locationFilter],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      let query = supabase
        .from("events")
        .select("*, cities!inner(slug, name)")
        .eq("status", "active")
        .gte("date_start", today)
        .order("date_start", { ascending: true })
        .limit(80);

      // For NI-wide pages, optionally filter by selected location
      if (isNIWide) {
        if (locationFilter) {
          query = query.eq("cities.slug", locationFilter);
        }
      } else {
        query = query.eq("cities.slug", parsed!.citySlug);
      }

      if (parsed?.neighbourhoodSlug && neighbourhood) {
        query = query.eq("neighbourhood_id", neighbourhood.id);
      }

      if (dateRange) {
        query = query.gte("date_start", dateRange.start).lte("date_start", dateRange.end);
      }

      if (parsed?.modifierSlug === "free") {
        query = query.eq("is_free", true);
      }
      // For family pages: do NOT filter by is_family_friendly in DB query
      // Instead, fetch broadly and apply strict client-side filtering
      // This ensures events with family/kids tags but is_family_friendly=false are included

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!parsed?.citySlug && shouldFetchEvents,
  });

  // Exclusion terms for live music pages
  const LIVE_MUSIC_EXCLUDE_TERMS = ["class", "classes", "course", "courses", "workshop", "workshops", "lesson", "lessons", "recording", "dj set", "dj night", "tutorial"];

  // Apply family/date-night/live-music filtering + priority sorting to events
  const events = useMemo(() => {
    if (!rawEvents) return rawEvents;

    // LIVE MUSIC filtering — only real performances
    if (parsed?.categorySlug === "live-music") {
      return rawEvents.filter(event => {
        const tags: string[] = event.tags || [];
        const title = event.title.toLowerCase();
        const desc = (event.short_description || event.description || "").toLowerCase();
        const combined = title + " " + desc;

        // Exclude non-performance content
        if (LIVE_MUSIC_EXCLUDE_TERMS.some(t => combined.includes(t))) return false;
        if (tags.includes("workshop") || tags.includes("workshops")) return false;

        // Include if has music performance tags
        if (tags.some(t => ["live-music", "music", "concert", "gig", "band", "acoustic", "jazz"].includes(t))) return true;

        // Include if title suggests live performance
        if (title.includes("live") || title.includes("concert") || title.includes("gig") ||
            title.includes("band") || title.includes("acoustic") || title.includes("session") ||
            title.includes("singer") || title.includes("songwriter")) return true;

        // Include general music events (not classes/workshops which are already excluded above)
        if (tags.includes("music") || title.includes("music")) return true;

        return false;
      });
    }

    // DATE NIGHT filtering
    if (isDateNightPage) {
      const DATE_NIGHT_PRIORITY: Record<string, number> = {
        "theatre": 10, "comedy": 9, "live-music": 8, "cinema": 8, "film": 7,
        "date-night": 10, "jazz": 7, "cabaret": 7, "music": 6, "art": 5,
        "exhibitions": 4, "nightlife": 3, "cocktails": 3,
      };

      const filtered = rawEvents.filter(event => {
        const tags: string[] = event.tags || [];
        const title = event.title.toLowerCase();

        // Include if has date-night-relevant tags
        if (tags.some(t => DATE_NIGHT_EVENT_TAGS.includes(t))) return true;

        // Include evening events (time_start >= 17:00)
        if (event.time_start) {
          const hour = parseInt(event.time_start.split(":")[0]);
          if (hour >= 17) return true;
        }

        // Include if title suggests date-night content
        if (title.includes("comedy") || title.includes("theatre") || title.includes("concert") ||
            title.includes("jazz") || title.includes("wine") || title.includes("cocktail") ||
            title.includes("cinema") || title.includes("film") || title.includes("cabaret")) return true;

        // Exclude kids/family-only events
        if (tags.some(t => DATE_NIGHT_EXCLUDED_TAGS.includes(t)) && !tags.some(t => DATE_NIGHT_EVENT_TAGS.includes(t))) return false;

        return false;
      });

      return filtered.sort((a, b) => {
        const aTags: string[] = a.tags || [];
        const bTags: string[] = b.tags || [];
        const aScore = aTags.reduce((s, t) => s + (DATE_NIGHT_PRIORITY[t] || 0), 0);
        const bScore = bTags.reduce((s, t) => s + (DATE_NIGHT_PRIORITY[t] || 0), 0);
        if (bScore !== aScore) return bScore - aScore;
        return a.date_start.localeCompare(b.date_start);
      });
    }

    if (!isFamilyPage) return rawEvents;
    
    // Helper: detect professional sports fixtures by title pattern
    const isProfessionalSport = (event: typeof rawEvents[0]) => {
      const t = event.title.toLowerCase();
      const tags: string[] = event.tags || [];
      const hasSportTag = tags.includes("sport") || tags.includes("boxing") || tags.includes("rugby") || tags.includes("football");
      const isVsMatch = /\bvs\.?\b|\bversus\b/i.test(event.title);
      const isChampionship = /championship|league|cup\b/i.test(event.title);
      const isRace = /\b\d+k\b|\bmarathon\b|\bhalf.?marathon\b/i.test(t);
      return hasSportTag && (isVsMatch || isChampionship || isRace);
    };

    // Helper: is genuinely family-oriented
    const isGenuinelyFamily = (event: typeof rawEvents[0]) => {
      const t = event.title.toLowerCase();
      const tags: string[] = event.tags || [];
      return tags.includes("kids") || tags.includes("workshop") || tags.includes("workshops") ||
        t.includes("children") || t.includes("kids") || t.includes("family fun") ||
        t.includes("family day") || t.includes("family festival");
    };

    // Helper: has any family signal
    const hasFamilySignal = (event: typeof rawEvents[0]) => {
      const tags: string[] = event.tags || [];
      return event.is_family_friendly || 
        tags.includes("family") || tags.includes("kids") ||
        isGenuinelyFamily(event);
    };

    // STRICT FILTER: must have family signal, exclude nightlife/sports/bars
    const EXCLUDED_TAGS_SET = new Set(["nightlife", "late-night", "cocktails", "adults-only"]);
    const filtered = rawEvents.filter(event => {
      const tags: string[] = event.tags || [];
      if (!hasFamilySignal(event)) return false;
      if (tags.some(t => EXCLUDED_TAGS_SET.has(t))) return false;
      if (isProfessionalSport(event) && !isGenuinelyFamily(event)) return false;
      return true;
    });

    // Sort by family relevance
    return filtered.sort((a, b) => {
      const aTags: string[] = a.tags || [];
      const bTags: string[] = b.tags || [];
      const aScore = aTags.reduce((s, t) => s + (FAMILY_EVENT_PRIORITY_TAGS[t] || 0), 0) +
        (isGenuinelyFamily(a) ? 15 : 0);
      const bScore = bTags.reduce((s, t) => s + (FAMILY_EVENT_PRIORITY_TAGS[t] || 0), 0) +
        (isGenuinelyFamily(b) ? 15 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return a.date_start.localeCompare(b.date_start);
    });
  }, [rawEvents, isFamilyPage, isDateNightPage]);

  // Group events by town/council area for NI-wide pages
  const eventsByCity = useMemo(() => {
    if (!events || !isNIWide || locationFilter) return null;
    const grouped: Record<string, typeof events> = {};
    for (const event of events) {
      // Prefer council_area, then city name for grouping
      const groupName = (event as any).council_area || (event.cities as any)?.name || "Northern Ireland";
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(event);
    }
    // Sort cities: those with most events first
    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  }, [events, isNIWide, locationFilter]);

  const eventCount = events?.length || 0;
  const listingCount = listings?.length || 0;
  const venueCount = venueListings?.length || 0;
  const itemCount = (showEvents ? eventCount + venueCount : listingCount) + (shouldFetchEvents && !showEvents ? eventCount : 0);
  const isNeighbourhoodPage = !!parsed?.neighbourhoodSlug;
  const hasEnoughContent = meetsContentThreshold(itemCount, showEvents, isNeighbourhoodPage);
  const isThin = isThinContent(itemCount);

  // Canonical URL
  const canonicalSlug = useMemo(() => {
    if (!parsed) return null;
    return getCanonicalSlug(
      parsed.modifierSlug,
      parsed.categorySlug,
      parsed.neighbourhoodSlug,
      parsed.citySlug,
      parsed.timeIntent
    );
  }, [parsed]);

  // SEO content
  const title = category && city
    ? generateTitle(modifier?.name?.toLowerCase() || parsed?.modifierSlug || null, category.name, locationName, cityName, parsed?.timeIntent, parsed?.nearLandmark)
    : "Loading...";

  const metaDesc = category && city
    ? generateMetaDescription(modifier?.name?.toLowerCase() || parsed?.modifierSlug || null, category.name, locationName, cityName, parsed?.timeIntent, parsed?.nearLandmark)
    : "";

  const introText = category && city
    ? generateIntroText(modifier?.name?.toLowerCase() || parsed?.modifierSlug || null, category.name, locationName, itemCount, cityName, parsed?.timeIntent)
    : "";

  const faqItems = useMemo(() => {
    if (!category || !city || !hasEnoughContent) return [];
    return generateFaqItems(
      modifier?.name?.toLowerCase() || parsed?.modifierSlug || null,
      category.name,
      locationName,
      itemCount,
      cityName,
      parsed?.timeIntent
    );
  }, [category, city, modifier, parsed, locationName, itemCount, cityName, hasEnoughContent]);

  useEffect(() => {
    if (title !== "Loading...") {
      document.title = title;
      const metaEl = document.querySelector('meta[name="description"]');
      if (metaEl) metaEl.setAttribute("content", metaDesc);

      // Set canonical link
      let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalEl) {
        canonicalEl = document.createElement("link");
        canonicalEl.rel = "canonical";
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.href = `https://bestlocal.co.uk${canonicalSlug || currentUrl}`;

      // Noindex thin pages
      let robotsEl = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
      if (!hasEnoughContent && itemCount === 0) {
        if (!robotsEl) {
          robotsEl = document.createElement("meta");
          robotsEl.name = "robots";
          document.head.appendChild(robotsEl);
        }
        robotsEl.content = "noindex, follow";
      } else if (robotsEl) {
        robotsEl.remove();
      }
    }
  }, [title, metaDesc]);

  // JSON-LD
  const jsonLd = useMemo(() => {
    if (!category || !city) return null;

    if (showEvents && events?.length) {
      return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: title,
        description: metaDesc,
        numberOfItems: events.length,
        itemListElement: events.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Event",
            name: e.title,
            description: e.short_description,
            startDate: e.date_start,
            endDate: e.date_end || e.date_start,
            location: e.venue_name ? { "@type": "Place", name: e.venue_name, address: e.venue_address } : undefined,
            isAccessibleForFree: e.is_free,
            image: e.image_url,
          },
        })),
      };
    }

    if (listings?.length) {
      return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: title,
        description: metaDesc,
        numberOfItems: listings.length,
        itemListElement: listings.map((l, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "LocalBusiness",
            name: l.name,
            description: l.short_description,
            address: l.address,
            aggregateRating: l.rating
              ? { "@type": "AggregateRating", ratingValue: l.rating, reviewCount: l.review_count }
              : undefined,
            image: l.image_url,
            url: l.website,
          },
        })),
      };
    }

    return null;
  }, [listings, events, category, city, title, metaDesc, showEvents]);

  // Breadcrumb
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: "Home", url: "/" }];
    if (isNIWide) {
      crumbs.push({ label: "Northern Ireland", url: "/" });
    } else if (city) {
      crumbs.push({ label: city.name, url: `/${city.slug}` });
    }
    if (neighbourhood) crumbs.push({ label: neighbourhood.name, url: `/things-to-do-${neighbourhood.slug}-${city?.slug}` });
    if (category) {
      const parts = [modifier?.name, category.name, parsed?.timeIntent ? formatTimeIntent(parsed.timeIntent) : ""].filter(Boolean);
      crumbs.push({ label: parts.join(" "), url: "" });
    }
    return crumbs;
  }, [city, neighbourhood, category, modifier, parsed, isNIWide]);

  // Filter options
  const filterOptions = useMemo(() => {
    if (!parsed || !city) return [];
    const filters: { label: string; value: string; url: string }[] = [];
    // For NI-wide pages, omit city slug from URLs (parser defaults to NI-wide)
    const urlCity = isNIWide ? null : parsed.citySlug;

    if (!parsed.timeIntent) {
      filters.push(
        { label: "Today", value: "today", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, urlCity as any, "today") },
        { label: "This Weekend", value: "this-weekend", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, urlCity as any, "this-weekend") },
        { label: "This Week", value: "this-week", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, urlCity as any, "this-week") },
      );
    }
    if (parsed.modifierSlug !== "free") {
      filters.push({ label: "Free", value: "free", url: buildPageUrl("free", parsed.categorySlug, parsed.neighbourhoodSlug, urlCity as any, parsed.timeIntent) });
    }
    if (parsed.modifierSlug !== "family") {
      filters.push({ label: "Family", value: "family", url: buildPageUrl("family", parsed.categorySlug, parsed.neighbourhoodSlug, urlCity as any, parsed.timeIntent) });
    }

    return filters;
  }, [parsed, city]);

  return (
    <Layout>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      )}
      {breadcrumbs.length > 1 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: breadcrumbs.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.label,
                ...(c.url ? { item: `https://bestlocal.co.uk${c.url}` } : {}),
              })),
            }),
          }}
        />
      )}

      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.url ? (
                  <Link to={crumb.url} className="hover:text-foreground transition-colors">{crumb.label}</Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          {city && (
            <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-2">
              <MapPin className="h-3.5 w-3.5" />
              {isNIWide ? (
                <span>Northern Ireland</span>
              ) : (
                <Link to={`/${city.slug}`} className="hover:text-foreground transition-colors">
                  {neighbourhood ? `${neighbourhood.name}, ${city.name}` : city.name}
                </Link>
              )}
              {parsed?.timeIntent && (
                <>
                  <span className="text-border">·</span>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatTimeIntent(parsed.timeIntent)}</span>
                </>
              )}
            </div>
          )}
          <h1 className="font-display font-bold text-2xl md:text-[2rem] text-foreground tracking-tight">{title}</h1>
          {metaDesc && <p className="text-muted-foreground text-[14px] mt-2 max-w-2xl leading-relaxed">{metaDesc}</p>}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AdPlaceholder slot="header" />

        {/* Cluster Navigation — sibling pages */}
        {siblingPages.length > 0 && (
          <div className="my-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Also in this section</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {siblingPages.map((page) => (
                <Link
                  key={page.url}
                  to={page.url}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    page.url === currentUrl
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        {filterOptions.length > 0 && (
          <div className="flex items-center gap-2 my-4 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filterOptions.map((f) => (
              <Link
                key={f.value}
                to={f.url}
                className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {f.label}
              </Link>
            ))}
            {parsed?.timeIntent && (
              <Link
                to={buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, isNIWide ? null as any : parsed.citySlug)}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-full"
              >
                {formatTimeIntent(parsed.timeIntent)} ✕
              </Link>
            )}
          </div>
        )}

        {/* Location filter for NI-wide pages */}
        {isNIWide && niCities.length > 0 && (
          <div className="flex items-center gap-2 my-4 flex-wrap">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => setLocationFilter(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                !locationFilter
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              All Northern Ireland
            </button>
            {niCities.map((c) => (
              <button
                key={c.slug}
                onClick={() => setLocationFilter(locationFilter === c.slug ? null : c.slug)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  locationFilter === c.slug
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {introText && hasEnoughContent && (
          <p className="text-muted-foreground text-[14px] leading-relaxed max-w-3xl my-6">{introText}</p>
        )}

        {/* Thin content warning — noindex + helpful redirect */}
        {!hasEnoughContent && itemCount === 0 && (
          <div className="my-8 p-6 bg-card border border-border rounded-lg text-center card-shadow">
            <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
            <h2 className="font-display font-semibold text-base text-foreground mb-2">
              Not enough content yet
            </h2>
            <p className="text-[13px] text-muted-foreground mb-4 max-w-md mx-auto leading-relaxed">
              We don't have enough {showEvents ? "events" : "listings"} for this page yet.
              Try one of these popular alternatives instead:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {siblingPages.slice(0, 5).map((page) => (
                <Link
                  key={page.url}
                  to={page.url}
                  className="px-3 py-1.5 text-[12px] font-medium bg-secondary text-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {page.label}
                </Link>
              ))}
              {city && !isNIWide && (
                <Link
                  to={`/${city.slug}`}
                  className="px-3 py-1.5 text-[12px] font-medium bg-accent text-accent-foreground rounded-full"
                >
                  Explore {city.name}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Thin content notice — page exists but borderline */}
        {isThin && hasEnoughContent && (
          <div className="my-4 px-4 py-3 bg-secondary rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              We're still growing our {showEvents ? "events" : "listings"} for this area. Check back soon for more — or explore related pages below.
            </p>
          </div>
        )}

        {/* Events Grid */}
        {showEvents && (
          <div className="my-8">
            <h2 className="font-display font-semibold text-xl text-foreground mb-6">
              {modifier?.name || ""} {category?.name || "Events"} {locationFilter ? `in ${niCities.find(c => c.slug === locationFilter)?.name || ""}` : `Across ${locationName}`}
              {parsed?.timeIntent ? ` ${formatTimeIntent(parsed.timeIntent)}` : ""}
            </h2>
            {events && events.length > 0 ? (
              <>
                {/* Grouped by city for NI-wide pages without location filter */}
                {eventsByCity && !locationFilter ? (
                  <div className="space-y-8">
                    {eventsByCity.map(([cityGroupName, cityEvents]) => (
                      <div key={cityGroupName}>
                        <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent" />
                          {cityGroupName}
                          <span className="text-xs text-muted-foreground font-normal">({cityEvents.length} event{cityEvents.length !== 1 ? "s" : ""})</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {cityEvents.map((event, i) => (
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
                              imageSource={(event as any).image_source}
                              imageAlt={(event as any).image_alt}
                              imageStatus={(event as any).image_status}
                              categorySlug={parsed?.categorySlug}
                              cityName={cityGroupName}
                              isFree={event.is_free}
                              isFamilyFriendly={event.is_family_friendly}
                              ticketUrl={event.ticket_url}
                              price={event.price}
                              tags={event.tags || []}
                              index={i}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event, i) => (
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
                        imageSource={(event as any).image_source}
                        imageAlt={(event as any).image_alt}
                        imageStatus={(event as any).image_status}
                        categorySlug={parsed?.categorySlug}
                        cityName={(event.cities as any)?.name || city?.name}
                        isFree={event.is_free}
                        isFamilyFriendly={event.is_family_friendly}
                        ticketUrl={event.ticket_url}
                        price={event.price}
                        tags={event.tags || []}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-muted/50 rounded-lg">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">
                  {isFamilyPage ? "We're curating more family-friendly events for this area." : "No events found for this search yet"}
                </p>
                <p className="text-muted-foreground text-xs mt-1 mb-4">
                  {isFamilyPage ? "Only genuinely family-suitable events are shown here." : "We're adding new events all the time — check back soon!"}
                </p>
                {siblingPages.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {siblingPages.slice(0, 4).map((page) => (
                      <Link key={page.url} to={page.url} className="text-xs px-3 py-1.5 bg-card border border-border text-accent rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                        {page.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Venue Listings for event-category pages (e.g. live music venues, theatres) */}
        {showEvents && venueListings && venueListings.length > 0 && (
          <div className="my-8">
            <h2 className="font-display font-semibold text-xl text-foreground mb-6">
              <MapPin className="inline h-5 w-5 mr-2 text-accent" />
              {parsed?.categorySlug === "live-music" ? "Music Venues & Bars" :
               parsed?.categorySlug === "theatre" ? "Theatres & Performance Venues" :
               parsed?.categorySlug === "comedy" ? "Comedy Venues" :
               "Venues"} {locationFilter ? `in ${niCities.find(c => c.slug === locationFilter)?.name || ""}` : isNIWide ? "Across Northern Ireland" : `in ${locationName}`}
            </h2>
            {isNIWide && !locationFilter ? (
              <div className="space-y-8">
                {(() => {
                  const grouped: Record<string, typeof venueListings> = {};
                  for (const l of venueListings) {
                    const cn = (l.cities as any)?.name || "Unknown";
                    if (!grouped[cn]) grouped[cn] = [];
                    grouped[cn].push(l);
                  }
                  return Object.entries(grouped)
                    .sort((a, b) => b[1].length - a[1].length)
                    .map(([cityGroupName, cityListings]) => (
                      <div key={cityGroupName}>
                        <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent" />
                          {cityGroupName}
                          <span className="text-xs text-muted-foreground font-normal">({cityListings.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {cityListings.map((listing, i) => (
                            <div key={listing.id} className="relative">
                              <span className="absolute -top-2 -left-2 z-10 w-7 h-7 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold card-shadow">
                                {i + 1}
                              </span>
                              <ListingCard
                                name={listing.name}
                                slug={listing.slug}
                                citySlug={(listing.cities as any)?.slug || ""}
                                shortDescription={listing.short_description || ""}
                                rating={listing.rating}
                                reviewCount={listing.review_count || 0}
                                imageUrl={listing.image_url}
                                imageSource={(listing as any).image_source}
                                imageAlt={(listing as any).image_alt}
                                imageStatus={(listing as any).image_status}
                                categorySlug={(listing.categories as any)?.slug}
                                categoryName={(listing.categories as any)?.name}
                                cityName={cityGroupName}
                                address={listing.address}
                                priceLevel={listing.price_level}
                                googleMapsLink={listing.google_maps_link}
                                isFeatured={listing.is_featured}
                                index={i}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {venueListings.map((listing, i) => (
                  <div key={listing.id} className="relative">
                    <span className="absolute -top-2 -left-2 z-10 w-7 h-7 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold card-shadow">
                      {i + 1}
                    </span>
                    <ListingCard
                      name={listing.name}
                      slug={listing.slug}
                      citySlug={(listing.cities as any)?.slug || ""}
                      shortDescription={listing.short_description || ""}
                      rating={listing.rating}
                      reviewCount={listing.review_count || 0}
                      imageUrl={listing.image_url}
                      imageSource={(listing as any).image_source}
                      imageAlt={(listing as any).image_alt}
                      imageStatus={(listing as any).image_status}
                      categorySlug={(listing.categories as any)?.slug}
                      categoryName={(listing.categories as any)?.name}
                      cityName={(listing.cities as any)?.name}
                      address={listing.address}
                      priceLevel={listing.price_level}
                      googleMapsLink={listing.google_maps_link}
                      isFeatured={listing.is_featured}
                      index={i}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showEvents && shouldFetchEvents && events && events.length > 0 && (
          <div className="my-8">
            <h2 className="font-display font-semibold text-xl text-foreground mb-6">
              <Calendar className="inline h-5 w-5 mr-2 text-accent" />
              {isDateNightPage ? "Evening Events & Shows" : isFamilyPage ? "Family Events" : parsed?.modifierSlug === "free" ? "Free Events" : "Events"} {parsed?.timeIntent ? formatTimeIntent(parsed.timeIntent) : ""} {locationFilter ? `in ${niCities.find(c => c.slug === locationFilter)?.name || ""}` : isNIWide ? "Across Northern Ireland" : `in ${locationName}`}
            </h2>
            {eventsByCity && !locationFilter ? (
              <div className="space-y-8">
                {eventsByCity.map(([cityGroupName, cityEvents]) => (
                  <div key={cityGroupName}>
                    <h3 className="font-display font-semibold text-base text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      {cityGroupName}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cityEvents.map((event, i) => (
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
                          imageSource={(event as any).image_source}
                          imageAlt={(event as any).image_alt}
                          imageStatus={(event as any).image_status}
                          cityName={cityGroupName}
                          isFree={event.is_free}
                          isFamilyFriendly={event.is_family_friendly}
                          ticketUrl={event.ticket_url}
                          price={event.price}
                          tags={event.tags || []}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event, i) => (
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
                    imageSource={(event as any).image_source}
                    imageAlt={(event as any).image_alt}
                    imageStatus={(event as any).image_status}
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
            )}
          </div>
        )}

        {/* Landmark Map */}
        {isLandmarkPage && landmark && listings && listings.length > 0 && (
          <div className="my-8">
            <LandmarkMap
              landmarkName={landmark.name}
              landmarkLat={landmark.latitude}
              landmarkLng={landmark.longitude}
              listings={listings.map((l) => ({
                name: l.name,
                latitude: l.latitude,
                longitude: l.longitude,
                slug: l.slug,
              }))}
              radiusKm={landmark.radius_km}
            />
          </div>
        )}

        {/* Explore Near Other Landmarks */}
        {isLandmarkPage && landmarks && landmarks.length > 1 && (
          <div className="my-6">
            <h3 className="font-display font-semibold text-sm text-foreground mb-3">Explore Near Other Landmarks</h3>
            <div className="flex flex-wrap gap-2">
              {landmarks
                .filter((l) => l.slug !== parsed?.nearLandmark)
                .slice(0, 6)
                .map((l) => (
                  <Link
                    key={l.slug}
                    to={`/${parsed?.categorySlug || "things-to-do"}-near-${l.slug}-${parsed?.citySlug || "belfast"}`}
                    className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent/40 hover:text-accent transition-colors"
                  >
                    {parsed?.categorySlug === "things-to-do" ? "Things To Do" : category?.name || "Places"} Near {l.name}
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {!showEvents && (
          <div className="my-8">
            <h2 className="font-display font-semibold text-xl text-foreground mb-6">
              {isLandmarkPage
                ? `${category?.name || "Places"} Near ${landmark?.name}`
                : isDateNightPage
                  ? "Bars, Restaurants & Venues"
                  : isWeekendPage
                    ? `Popular Places ${formatTimeIntent(parsed?.timeIntent || null)}`
                    : `Top ${modifier?.name || ""} ${category?.name || "Places"}`
              } {locationFilter ? `in ${niCities.find(c => c.slug === locationFilter)?.name || ""}` : isNIWide ? "Across Northern Ireland" : `in ${isLandmarkPage ? city?.name || "" : locationName}`}
            </h2>
            {listings && listings.length > 0 ? (
              <>
                {/* Grouped by city for NI-wide listing pages */}
                {isNIWide && !locationFilter ? (
                  <div className="space-y-8">
                    {(() => {
                      const grouped: Record<string, typeof listings> = {};
                      for (const l of listings) {
                        const cn = (l.cities as any)?.name || "Unknown";
                        if (!grouped[cn]) grouped[cn] = [];
                        grouped[cn].push(l);
                      }
                      return Object.entries(grouped)
                        .sort((a, b) => b[1].length - a[1].length)
                        .map(([cityGroupName, cityListings]) => (
                          <div key={cityGroupName}>
                            <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-accent" />
                              {cityGroupName}
                              <span className="text-xs text-muted-foreground font-normal">({cityListings.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {cityListings.map((listing, i) => (
                                <div key={listing.id} className="relative">
                                  <span className="absolute -top-2 -left-2 z-10 w-7 h-7 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold card-shadow">
                                    {i + 1}
                                  </span>
                                  <ListingCard
                                    name={listing.name}
                                    slug={listing.slug}
                                    citySlug={(listing.cities as any)?.slug || ""}
                                    shortDescription={listing.short_description || ""}
                                    rating={listing.rating}
                                    reviewCount={listing.review_count || 0}
                                    imageUrl={listing.image_url}
                                    imageSource={(listing as any).image_source}
                                    imageAlt={(listing as any).image_alt}
                                    imageStatus={(listing as any).image_status}
                                    categorySlug={(listing.categories as any)?.slug}
                                    categoryName={(listing.categories as any)?.name}
                                    cityName={cityGroupName}
                                    address={listing.address}
                                    priceLevel={listing.price_level}
                                    googleMapsLink={listing.google_maps_link}
                                    isFeatured={listing.is_featured}
                                    index={i}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing, i) => (
                      <div key={listing.id} className="relative">
                        <span className="absolute -top-2 -left-2 z-10 w-7 h-7 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold card-shadow">
                          {i + 1}
                        </span>
                        <ListingCard
                          name={listing.name}
                          slug={listing.slug}
                          citySlug={parsed?.citySlug || ""}
                          shortDescription={listing.short_description || ""}
                          rating={listing.rating}
                          reviewCount={listing.review_count || 0}
                          imageUrl={listing.image_url}
                          imageSource={(listing as any).image_source}
                          imageAlt={(listing as any).image_alt}
                          imageStatus={(listing as any).image_status}
                          categorySlug={(listing.categories as any)?.slug}
                          categoryName={(listing.categories as any)?.name}
                          neighbourhoodName={neighbourhood?.name}
                          cityName={(listing.cities as any)?.name || city?.name}
                          address={listing.address}
                          priceLevel={listing.price_level}
                          googleMapsLink={listing.google_maps_link}
                          isFeatured={listing.is_featured}
                          index={i}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-muted/50 rounded-lg">
                <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">
                  {isFamilyPage
                    ? "We're curating more family-friendly recommendations across Northern Ireland."
                    : "No listings yet — we're collecting the best places."}
                </p>
                <p className="text-muted-foreground text-xs mt-1 mb-4">
                  {isFamilyPage
                    ? "Quality matters — we only show genuinely family-suitable places."
                    : "Check back soon for curated recommendations."}
                </p>
                {siblingPages.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {siblingPages.slice(0, 4).map((page) => (
                      <Link key={page.url} to={page.url} className="text-xs px-3 py-1.5 bg-card border border-border text-accent rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                        {page.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <AdPlaceholder slot="mid-content" />

        {/* Cross-cluster links */}
        {crossClusterLinks.length > 0 && (
          <section className="py-8 border-t border-border">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              More in {city?.name || "this city"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {crossClusterLinks.map((link) => (
                <Link
                  key={link.url}
                  to={link.url}
                  className="group flex items-center justify-between p-4 bg-card border border-border rounded-lg card-shadow hover:card-shadow-hover transition-all"
                >
                  <div>
                    <span className="font-display font-medium text-sm text-foreground group-hover:text-accent transition-colors">{link.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {faqItems.length > 0 && (
          <section className="py-8 border-t border-border">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3 max-w-3xl">
              {faqItems.map((faq, i) => (
                <details key={i} className="bg-card border border-border rounded-lg group">
                  <summary className="p-4 cursor-pointer font-display font-medium text-sm text-foreground hover:text-accent transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform shrink-0" />
                  </summary>
                  <div className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related searches (from seo-utils) */}
        {allCategories && modifiers && parsed && city && (
          <section className="py-8 border-t border-border">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Related Searches</h2>
            <div className="flex flex-wrap gap-2">
              {/* Time intent variations */}
              {!parsed.timeIntent && ["this-weekend", "today", "this-week"].map((ti) => (
                <Link
                  key={ti}
                  to={buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, ti)}
                  className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent hover:text-accent transition-colors"
                >
                  {modifier?.name || ""} {category?.name || ""} {locationName} {formatTimeIntent(ti)}
                </Link>
              ))}
              {/* Category variations */}
              {allCategories
                .filter((c) => c.slug !== parsed.categorySlug)
                .slice(0, 5)
                .map((cat) => (
                  <Link
                    key={cat.slug}
                    to={buildPageUrl(parsed.modifierSlug, cat.slug, parsed.neighbourhoodSlug, parsed.citySlug, parsed.timeIntent)}
                    className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent hover:text-accent transition-colors"
                  >
                    {modifier?.name || ""} {cat.name} {neighbourhood?.name || city?.name || ""}
                  </Link>
                ))}
              {/* Modifier variations */}
              {modifiers
                .filter((m) => m.slug !== parsed.modifierSlug)
                .slice(0, 4)
                .map((mod) => (
                  <Link
                    key={mod.slug}
                    to={buildPageUrl(mod.slug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, parsed.timeIntent)}
                    className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent hover:text-accent transition-colors"
                  >
                    {mod.name} {category?.name || ""} {neighbourhood?.name || city?.name || ""}
                  </Link>
                ))}
              {/* Neighbourhood variations */}
              {!parsed.neighbourhoodSlug && neighbourhoods
                ?.filter((n) => (n.cities as any)?.slug === parsed.citySlug)
                .slice(0, 4)
                .map((nb) => (
                  <Link
                    key={nb.slug}
                    to={buildPageUrl(parsed.modifierSlug, parsed.categorySlug, nb.slug, parsed.citySlug, parsed.timeIntent)}
                    className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent hover:text-accent transition-colors"
                  >
                    {modifier?.name || "Best"} {category?.name || ""} {nb.name}
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Neighbourhood exploration */}
        {!parsed?.neighbourhoodSlug && neighbourhoods && city && (
          <section className="py-8 border-t border-border">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Explore {city.name} Neighbourhoods
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {neighbourhoods
                .filter((n) => (n.cities as any)?.slug === city.slug)
                .map((nb) => (
                  <Link
                    key={nb.id}
                    to={buildPageUrl(parsed?.modifierSlug || null, parsed?.categorySlug || "things-to-do", nb.slug, city.slug, parsed?.timeIntent)}
                    className="p-4 bg-card border border-border rounded-lg hover:border-accent/40 transition-colors group card-shadow"
                  >
                    <span className="font-medium text-sm text-foreground group-hover:text-accent transition-colors">{nb.name}</span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{nb.description}</p>
                  </Link>
                ))}
            </div>
          </section>
        )}

        <AdPlaceholder slot="footer" />
      </div>
    </Layout>
  );
};

export default ProgrammaticPage;
