import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { CategoryPill } from "@/components/CategoryPill";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { MapPin, Info, Calendar, Utensils, Coffee, Compass, ArrowRight, Music } from "lucide-react";
import { deduplicateListings, filterCompleteListings, validatePage, detectPageType, getRobotsDirective, generateSupportingIntro } from "@/lib/page-validation";
import { useEffect, useMemo } from "react";
import { setPageCanonical } from "@/lib/canonical";

/** Category slugs grouped by section */
const FOOD_DRINK_SLUGS = ["restaurants", "cafes", "brunch", "bars", "cocktail-bars", "halal-food", "alcohol-free", "italian"];
const FOOD_DRINK_TAGS = ["food", "dining", "date-night", "halal", "brunch"];
const THINGS_TO_DO_SLUGS = ["things-to-do", "attractions", "parks", "museums", "tours", "escape-rooms", "indoor-activities", "leisure-centres", "cinema", "cinemas", "gyms", "family-activities", "leisure-entertainment", "theatre", "comedy", "markets"];
const THINGS_TO_DO_TAGS = ["family", "outdoor", "indoor", "adventure", "culture", "nature", "fitness", "family_friendly"];

const CityPage = () => {
  const { citySlug, "*": wildcard } = useParams();
  const resolvedCitySlug = citySlug || wildcard || "";
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const { data: city } = useQuery({
    queryKey: ["city", resolvedCitySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("slug", resolvedCitySlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!resolvedCitySlug,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch ALL listings for this city (we section them client-side)
  const { data: listings } = useQuery({
    queryKey: ["city-listings-all", resolvedCitySlug, city?.id],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name, id)")
        .eq("cities.slug", resolvedCitySlug)
        .order("rating", { ascending: false })
        .limit(100);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!resolvedCitySlug && !!city,
  });

  // Fetch nearby listings if this city has few results
  const { data: nearbyListings } = useQuery({
    queryKey: ["city-nearby-listings", resolvedCitySlug, city?.nearby_city_slugs],
    queryFn: async () => {
      if (!city?.nearby_city_slugs?.length) return [];
      const nearbySlugs = city.nearby_city_slugs.slice(0, 5);
      const { data, error } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .in("cities.slug", nearbySlugs)
        .order("rating", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!city && !!listings && listings.length < 8,
  });

  // Fetch upcoming events
  const { data: cityEvents } = useQuery({
    queryKey: ["city-events", city?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      // Fetch events for this city + nearby cities for better coverage
      const citySlugs = [resolvedCitySlug, ...(city?.nearby_city_slugs?.slice(0, 3) || [])];
      const { data } = await supabase
        .from("events")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .in("cities.slug", citySlugs)
        .eq("status", "active")
        .gte("date_start", today)
        .order("date_start", { ascending: true })
        .limit(12);
      return data || [];
    },
    enabled: !!city,
  });

  // Section data
  const localListings = useMemo(() => {
    if (!listings) return [];
    const { unique } = deduplicateListings(listings as any);
    return filterCompleteListings(unique);
  }, [listings]);

  const foodDrink = useMemo(() => 
    localListings.filter((l: any) => {
      const catSlug = (l.categories as any)?.slug || "";
      const tags: string[] = (l as any).audience_tags || [];
      return FOOD_DRINK_SLUGS.includes(catSlug) || tags.some(t => FOOD_DRINK_TAGS.includes(t));
    }),
    [localListings]
  );

  const thingsToDo = useMemo(() =>
    localListings.filter((l: any) => {
      const catSlug = (l.categories as any)?.slug || "";
      const tags: string[] = (l as any).audience_tags || [];
      return THINGS_TO_DO_SLUGS.includes(catSlug) || tags.some(t => THINGS_TO_DO_TAGS.includes(t));
    }),
    [localListings]
  );

  const foodDrinkIds = new Set(foodDrink.map((l: any) => l.id));
  const thingsToDoIds = new Set(thingsToDo.map((l: any) => l.id));

  const otherListings = useMemo(() =>
    localListings.filter((l: any) => !foodDrinkIds.has(l.id) && !thingsToDoIds.has(l.id)),
    [localListings, foodDrinkIds, thingsToDoIds]
  );

  // Nearby (deduplicated against local)
  const nearbyItems = useMemo(() => {
    if (!nearbyListings) return [];
    const localIds = new Set(localListings.map((l: any) => l.id));
    return nearbyListings.filter((l: any) => !localIds.has(l.id));
  }, [nearbyListings, localListings]);

  // Events split: today vs upcoming
  const today = new Date().toISOString().split("T")[0];
  const todayEvents = useMemo(() => 
    (cityEvents || []).filter((e: any) => e.date_start === today),
    [cityEvents, today]
  );
  const upcomingEvents = useMemo(() =>
    (cityEvents || []).filter((e: any) => e.date_start > today),
    [cityEvents, today]
  );

  // Whether this city's own events come from this city specifically
  const localEvents = useMemo(() =>
    (cityEvents || []).filter((e: any) => (e.cities as any)?.slug === resolvedCitySlug),
    [cityEvents, resolvedCitySlug]
  );
  const nearbyEvents = useMemo(() =>
    (cityEvents || []).filter((e: any) => (e.cities as any)?.slug !== resolvedCitySlug),
    [cityEvents, resolvedCitySlug]
  );

  const totalContent = localListings.length + (cityEvents?.length || 0);
  const hasMinimalContent = totalContent < 5;

  // Filtered view (when category param is set)
  const filteredListings = useMemo(() => {
    if (!categoryFilter) return null;
    return localListings.filter((l: any) => (l.categories as any)?.slug === categoryFilter);
  }, [localListings, categoryFilter]);

  const validation = useMemo(() => {
    return validatePage({
      listings: (localListings || []) as any,
      pageType: detectPageType({ isNeighbourhood: false, isLandmark: false, isEvents: false, hasModifier: !!categoryFilter, categorySlug: categoryFilter }),
      hasIntro: !!city?.description,
      hasSectionHeading: true,
      hasFaq: false,
      isNicheModifier: false,
    });
  }, [localListings, city, categoryFilter]);

  useEffect(() => {
    setPageCanonical(window.location.pathname);
  }, [resolvedCitySlug, categoryFilter]);

  useEffect(() => {
    const robotsDirective = getRobotsDirective(validation);
    let robotsEl = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (robotsDirective) {
      if (!robotsEl) {
        robotsEl = document.createElement("meta");
        robotsEl.name = "robots";
        document.head.appendChild(robotsEl);
      }
      robotsEl.content = robotsDirective;
    } else if (robotsEl) {
      robotsEl.remove();
    }
  }, [validation]);

  // SEO title
  useEffect(() => {
    if (city) {
      const activeCategory = categories?.find((c) => c.slug === categoryFilter);
      document.title = activeCategory
        ? `Best ${activeCategory.name} in ${city.name} | City Scout Guide`
        : `Things To Do in ${city.name} | Events, Food & Activities | City Scout Guide`;
    }
  }, [city, categories, categoryFilter]);

  if (!city) return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  const activeCategory = categories?.find((c) => c.slug === categoryFilter);

  // Render helper for event cards
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

  const renderListingCard = (listing: any, i: number) => (
    <ListingCard
      key={listing.id}
      name={listing.name}
      slug={listing.slug}
      citySlug={(listing.cities as any)?.slug || resolvedCitySlug}
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
      audienceTags={(listing as any).audience_tags}
      description={(listing as any).description}
      index={i}
    />
  );

  // ── FILTERED VIEW ──
  if (categoryFilter && filteredListings) {
    return (
      <Layout>
        <section className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MapPin className="h-4 w-4" />
              <Link to={`/${resolvedCitySlug}`} className="hover:text-primary transition-colors">{city.name}</Link>
            </div>
            <h1 className="font-display font-bold text-foreground">
              Best {activeCategory?.name || categoryFilter} in {city.name}
            </h1>
          </div>
        </section>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-2 mb-6">
            <Link to={`/${resolvedCitySlug}`} className="px-4 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors">
              ← All
            </Link>
          </div>
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((l: any, i: number) => renderListingCard(l, i))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No {activeCategory?.name || categoryFilter} listings in {city.name} yet.</p>
              <Link to={`/${resolvedCitySlug}`} className="text-primary text-sm mt-2 inline-block hover:underline">
                Browse all places in {city.name} →
              </Link>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ── FULL TOWN PAGE ──
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-card border-b border-border">
        {city.image_url && (
          <div className="relative h-40 md:h-52 overflow-hidden">
            <img src={city.image_url} alt={city.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <MapPin className="h-4 w-4" />
            <span>{city.county || city.country}</span>
          </div>
          <h1 className="font-display font-bold text-foreground">
            Things To Do in {city.name}
          </h1>
          {city.description && (
            <p className="text-muted-foreground text-sm mt-1.5 max-w-xl leading-relaxed">{city.description}</p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick category links */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories?.slice(0, 10).map((cat) => (
            <Link
              key={cat.id}
              to={`/${resolvedCitySlug}/${cat.slug}`}
              className="px-3.5 py-2 rounded-full text-[13px] font-medium bg-secondary text-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Quick discovery links */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: `What's On ${city.name}`, to: `/whats-on-${resolvedCitySlug}` },
            { label: `Events ${city.name}`, to: `/events-${resolvedCitySlug}` },
            { label: `Things To Do`, to: `/things-to-do-${resolvedCitySlug}` },
            { label: `Live Music`, to: `/live-music-${resolvedCitySlug}` },
            { label: `Restaurants`, to: `/restaurants-${resolvedCitySlug}` },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-1.5 bg-card border border-border rounded-lg text-[13px] text-foreground hover:border-primary/40 hover:text-primary transition-colors card-shadow"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── SECTION 1: What's On ── */}
        {(todayEvents.length > 0 || upcomingEvents.length > 0) && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal" />
                What's On in {city.name}
              </h2>
              <Link to={`/events-${resolvedCitySlug}`} className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {todayEvents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-display font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">Today</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayEvents.slice(0, 3).map((e: any, i: number) => renderEventCard(e, i))}
                </div>
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div>
                <h3 className="font-display font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">Upcoming</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.slice(0, 6).map((e: any, i: number) => renderEventCard(e, i))}
                </div>
              </div>
            )}

            {/* Label nearby events */}
            {nearbyEvents.length > 0 && localEvents.length === 0 && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                Showing events from nearby towns
              </p>
            )}
          </section>
        )}

        <AdPlaceholder slot="header" />

        {/* ── SECTION 2: Things To Do ── */}
        {thingsToDo.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Compass className="h-5 w-5 text-teal" />
                Things To Do in {city.name}
              </h2>
              <Link to={`/things-to-do-${resolvedCitySlug}`} className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {thingsToDo.slice(0, 6).map((l: any, i: number) => renderListingCard(l, i))}
            </div>
          </section>
        )}

        {/* ── SECTION 3: Food & Drink ── */}
        {foodDrink.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Utensils className="h-5 w-5 text-teal" />
                Food & Drink in {city.name}
              </h2>
              <Link to={`/restaurants-${resolvedCitySlug}`} className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {foodDrink.slice(0, 6).map((l: any, i: number) => renderListingCard(l, i))}
            </div>
          </section>
        )}

        {/* ── SECTION 4: Other venues (live music, nightlife, etc) ── */}
        {otherListings.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display font-semibold text-foreground mb-4">
              More Places in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherListings.slice(0, 6).map((l: any, i: number) => renderListingCard(l, i))}
            </div>
          </section>
        )}

        <AdPlaceholder slot="mid-content" />

        {/* ── SECTION 5: Nearby Attractions (radius expansion) ── */}
        {nearbyItems.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display font-semibold text-foreground mb-2">
              Things To Do Near {city.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Discover attractions, restaurants and activities in nearby towns.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyItems.slice(0, 9).map((l: any, i: number) => renderListingCard(l, i))}
            </div>
          </section>
        )}

        {/* Empty state — always shows something */}
        {totalContent === 0 && nearbyItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-4">
              We're still curating listings for {city.name}. In the meantime, explore nearby areas.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(city.nearby_city_slugs || []).slice(0, 4).map((slug: string) => (
                <Link
                  key={slug}
                  to={`/${slug}`}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Explore {slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Internal links */}
        <section className="py-10 border-t border-border mt-8">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Explore More in {city.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/${resolvedCitySlug}/${cat.slug}`}
                className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {cat.name} in {city.name}
              </Link>
            ))}
            <Link
              to={`/whats-on-${resolvedCitySlug}`}
              className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              What's On {city.name}
            </Link>
            <Link
              to={`/live-music-${resolvedCitySlug}`}
              className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Live Music {city.name}
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CityPage;
