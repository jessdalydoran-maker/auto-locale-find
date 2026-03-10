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
import { useEffect, useMemo } from "react";

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
  const city = useMemo(() => cities?.find((c) => c.slug === parsed?.citySlug), [cities, parsed]);
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
  const locationName = isLandmarkPage ? landmark!.name : (neighbourhood?.name || city?.name || "");
  const cityName = (neighbourhood || isLandmarkPage) ? city?.name : undefined;
  const showEvents = parsed ? isEventCategory(parsed.categorySlug) : false;
  const isWeekendPage = parsed?.categorySlug === "things-to-do" && !!parsed?.timeIntent;
  const dateRange = parsed ? getTimeIntentDateRange(parsed.timeIntent || null) : null;
  const currentUrl = "/" + slug;

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
    return cityClusters;
  }, [city, neighbourhoods]);

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

  // Fetch regular listings (non-landmark pages)
  const { data: regularListings } = useQuery({
    queryKey: ["prog-listings", parsed?.categorySlug, parsed?.citySlug, parsed?.neighbourhoodSlug, parsed?.modifierSlug],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("cities.slug", parsed!.citySlug)
        .eq("is_approved", true)
        .order("rating", { ascending: false })
        .limit(20);

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
      return data;
    },
    enabled: !!parsed?.citySlug && !!parsed?.categorySlug && !showEvents && !isLandmarkPage,
  });

  const listings = isLandmarkPage ? nearbyListings : regularListings;

  // Fetch events (for event pages OR weekend/time-intent "things to do" pages)
  const { data: events } = useQuery({
    queryKey: ["prog-events", parsed?.categorySlug, parsed?.citySlug, parsed?.neighbourhoodSlug, parsed?.timeIntent, parsed?.modifierSlug],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, cities!inner(slug, name)")
        .eq("cities.slug", parsed!.citySlug)
        .eq("status", "active")
        .order("date_start", { ascending: true })
        .limit(20);

      if (parsed?.neighbourhoodSlug && neighbourhood) {
        query = query.eq("neighbourhood_id", neighbourhood.id);
      }

      if (dateRange) {
        query = query.gte("date_start", dateRange.start).lte("date_start", dateRange.end);
      }

      if (parsed?.modifierSlug === "free") {
        query = query.eq("is_free", true);
      }
      if (parsed?.modifierSlug === "family") {
        query = query.eq("is_family_friendly", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!parsed?.citySlug && (showEvents || isWeekendPage),
  });

  const itemCount = (showEvents ? (events?.length || 0) : (listings?.length || 0)) + (isWeekendPage ? (events?.length || 0) : 0);
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
    if (city) crumbs.push({ label: city.name, url: `/${city.slug}` });
    if (neighbourhood) crumbs.push({ label: neighbourhood.name, url: `/things-to-do-${neighbourhood.slug}-${city?.slug}` });
    if (category) {
      const parts = [modifier?.name, category.name, parsed?.timeIntent ? formatTimeIntent(parsed.timeIntent) : ""].filter(Boolean);
      crumbs.push({ label: parts.join(" "), url: "" });
    }
    return crumbs;
  }, [city, neighbourhood, category, modifier, parsed]);

  // Filter options
  const filterOptions = useMemo(() => {
    if (!parsed || !city) return [];
    const filters: { label: string; value: string; url: string }[] = [];

    if (!parsed.timeIntent) {
      filters.push(
        { label: "Today", value: "today", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, "today") },
        { label: "This Weekend", value: "this-weekend", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, "this-weekend") },
        { label: "This Week", value: "this-week", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, "this-week") },
      );
    }
    if (parsed.modifierSlug !== "free") {
      filters.push({ label: "Free", value: "free", url: buildPageUrl("free", parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, parsed.timeIntent) });
    }
    if (parsed.modifierSlug !== "family") {
      filters.push({ label: "Family", value: "family", url: buildPageUrl("family", parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, parsed.timeIntent) });
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
              <Link to={`/${city.slug}`} className="hover:text-foreground transition-colors">
                {neighbourhood ? `${neighbourhood.name}, ${city.name}` : city.name}
              </Link>
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
                to={buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug)}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-full"
              >
                {formatTimeIntent(parsed.timeIntent)} ✕
              </Link>
            )}
          </div>
        )}

        {/* Intro text */}
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
              {city && (
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
              {modifier?.name || ""} {category?.name || "Events"} in {locationName}
              {parsed?.timeIntent ? ` ${formatTimeIntent(parsed.timeIntent)}` : ""}
            </h2>
            {events && events.length > 0 ? (
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
                    cityName={city?.name}
                    isFree={event.is_free}
                    isFamilyFriendly={event.is_family_friendly}
                    ticketUrl={event.ticket_url}
                    price={event.price}
                    tags={event.tags || []}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/50 rounded-lg">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">No events found for this search yet</p>
                <p className="text-muted-foreground text-xs mt-1 mb-4">We're adding new events all the time — check back soon!</p>
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

        {/* Weekend Events Section (for things-to-do + time intent pages) */}
        {isWeekendPage && events && events.length > 0 && (
          <div className="my-8">
            <h2 className="font-display font-semibold text-xl text-foreground mb-6">
              <Calendar className="inline h-5 w-5 mr-2 text-accent" />
              Events {formatTimeIntent(parsed?.timeIntent || null)} in {locationName}
            </h2>
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
                : isWeekendPage
                  ? `Popular Places ${formatTimeIntent(parsed?.timeIntent || null)}`
                  : `Top ${itemCount > 0 ? itemCount : ""} ${modifier?.name || ""} ${category?.name || "Places"}`
              } in {isLandmarkPage ? city?.name || "" : locationName}
            </h2>
            {listings && listings.length > 0 ? (
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
                      cityName={city?.name}
                      address={listing.address}
                      priceLevel={listing.price_level}
                      googleMapsLink={listing.google_maps_link}
                      isFeatured={listing.is_featured}
                      index={i}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground text-sm font-medium">No listings found for this search yet</p>
                <p className="text-muted-foreground text-xs mt-1 mb-4">We're adding new places all the time!</p>
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
