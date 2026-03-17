import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { EventCard } from "@/components/EventCard";
import { ListingCard } from "@/components/ListingCard";
import { setPageCanonical } from "@/lib/canonical";
import { getImageUrl, getCategoryPlaceholder, buildImageErrorHandler } from "@/lib/image-utils";
import { Calendar, Utensils, Coins, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

/** Friday 18:00 → Sunday 23:59 range */
const getWeekendRange = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToFri = ((5 - day + 7) % 7) || (now.getHours() >= 18 ? 0 : 7);
  const fri = new Date(now);
  fri.setDate(now.getDate() + (day >= 5 && day <= 6 ? 0 : day === 0 ? -2 : diffToFri));
  fri.setHours(0, 0, 0, 0);
  // If we're already in the weekend window, start from today
  if (day === 5 || day === 6 || day === 0) {
    fri.setDate(now.getDate() - (day === 0 ? 2 : day - 5));
  }
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  return {
    start: fri.toISOString().split("T")[0],
    end: sun.toISOString().split("T")[0],
  };
};

const formatWeekendLabel = () => {
  const { start, end } = getWeekendRange();
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}, ${e.getFullYear()}`;
};

const WeekendGuidePage = () => {
  useEffect(() => {
    document.title = "Best Things To Do in Belfast This Weekend - Updated Weekly";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Discover the best things to do in Belfast this weekend. Updated every week with the latest events, restaurants, activities and free things to do in Belfast."
    );
    setPageCanonical("/things-to-do-belfast-this-weekend");
  }, []);

  const { start, end } = getWeekendRange();

  // Featured events this weekend
  const { data: weekendEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["weekend-events", start, end],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, cities!inner(slug, name), categories(slug, name)")
        .eq("status", "active")
        .lte("date_start", end)
        .gte("date_start", start)
        .order("date_start", { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  // Restaurant recommendations (Belfast, top-rated)
  const { data: restaurants } = useQuery({
    queryKey: ["weekend-restaurants"],
    queryFn: async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id")
        .in("slug", ["restaurants", "cafes"]);
      if (!cats?.length) return [];
      const catIds = cats.map((c) => c.id);
      const { data: belfastCity } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", "belfast")
        .maybeSingle();
      if (!belfastCity) return [];
      const { data } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("city_id", belfastCity.id)
        .in("category_id", catIds)
        .eq("is_approved", true)
        .eq("is_archived", false)
        .order("rating", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  // Free activities (Belfast)
  const { data: freeActivities } = useQuery({
    queryKey: ["weekend-free-activities"],
    queryFn: async () => {
      // Free events this weekend
      const { data: freeEvents } = await supabase
        .from("events")
        .select("id, title, slug, date_start, venue_name, short_description, image_url, image_source, image_alt, image_status, tags, is_free, is_family_friendly, ticket_url, price, cities!inner(slug, name)")
        .eq("status", "active")
        .eq("is_free", true)
        .lte("date_start", end)
        .gte("date_start", start)
        .order("date_start", { ascending: true })
        .limit(3);

      // Also grab free/low-cost listings (parks, walks, museums)
      const { data: belfastCity } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", "belfast")
        .maybeSingle();
      let freeListings: any[] = [];
      if (belfastCity) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id")
          .in("slug", ["things-to-do", "attractions", "family-activities"]);
        if (cats?.length) {
          const { data } = await supabase
            .from("listings")
            .select("*, cities!inner(slug, name), categories!inner(slug, name)")
            .eq("city_id", belfastCity.id)
            .in("category_id", cats.map((c) => c.id))
            .eq("is_approved", true)
            .eq("is_archived", false)
            .in("price_level", ["free", "cheap", "£"])
            .order("rating", { ascending: false })
            .limit(6);
          freeListings = data || [];
        }
      }
      return { events: freeEvents || [], listings: freeListings };
    },
  });

  const weekendLabel = formatWeekendLabel();

  return (
    <Layout>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(var(--hero-gradient-start)) 0%, hsl(var(--hero-gradient-mid)) 45%, hsl(var(--hero-gradient-end)) 100%)`,
        }}
      >
        <div className="container mx-auto px-4 pt-12 pb-10 md:pt-16 md:pb-14 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground/80 rounded-full text-xs font-medium mb-5 border border-primary-foreground/10">
              <Clock className="h-3 w-3" />
              Updated weekly · {weekendLabel}
            </div>
            <h1 className="font-display font-bold text-3xl md:text-[2.75rem] text-primary-foreground mb-4 leading-[1.12] tracking-tight">
              Best Things To Do in Belfast This Weekend
            </h1>
            <p className="text-primary-foreground/75 text-base md:text-lg leading-relaxed">
              Your weekly guide to the best events, restaurants, activities and free things to do in Belfast this weekend.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED EVENTS THIS WEEKEND ═══════ */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-xl text-foreground">
            Featured Events This Weekend
          </h2>
        </div>
        {eventsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : weekendEvents && weekendEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekendEvents.slice(0, 3).map((event, i) => (
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
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No events listed for this weekend yet — check back soon!</p>
          </div>
        )}
        {weekendEvents && weekendEvents.length > 3 && (
          <div className="mt-4 text-center">
            <Link to="/events-this-weekend" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline">
              See all weekend events <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* ═══════ RESTAURANT RECOMMENDATIONS ═══════ */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-6">
            <Utensils className="h-5 w-5 text-accent" />
            <h2 className="font-display font-semibold text-xl text-foreground">
              Restaurant Recommendations
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Top-rated places to eat in Belfast — perfect for a weekend meal out.
          </p>
          {restaurants && restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.slice(0, 6).map((listing, i) => {
                const catSlug = (listing.categories as any)?.slug || "";
                const citySlug = (listing.cities as any)?.slug || "belfast";
                return (
                  <ListingCard
                    key={listing.id}
                    name={listing.name}
                    slug={listing.slug}
                    citySlug={citySlug}
                    categorySlug={catSlug}
                    shortDescription={listing.short_description || ""}
                    imageUrl={getImageUrl(listing.image_url, listing.image_source, catSlug, citySlug, listing.image_status, listing.name, listing.audience_tags, listing.description)}
                    imageAlt={listing.image_alt || listing.name}
                    rating={listing.rating}
                    reviewCount={listing.review_count ?? 0}
                    priceLevel={listing.price_level}
                    address={listing.address}
                    googleMapsLink={listing.google_maps_link}
                    isFeatured={listing.is_featured}
                    index={i}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-background border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground">Restaurant recommendations coming soon.</p>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link to="/best-restaurants-belfast" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline">
              See all Belfast restaurants <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ FREE ACTIVITIES ═══════ */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Coins className="h-5 w-5 text-teal" />
          <h2 className="font-display font-semibold text-xl text-foreground">
            Free Things To Do This Weekend
          </h2>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Free events, parks, walks and activities in Belfast — no ticket needed.
        </p>

        {/* Free events */}
        {freeActivities?.events && freeActivities.events.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-medium text-base text-foreground mb-3">Free Events This Weekend</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeActivities.events.map((event, i) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  slug={event.slug}
                  shortDescription={event.short_description}
                  dateStart={event.date_start}
                  dateEnd={null}
                  timeStart={null}
                  venueName={event.venue_name}
                  venueAddress={null}
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
          </div>
        )}

        {/* Free listings */}
        {freeActivities?.listings && freeActivities.listings.length > 0 ? (
          <div>
            <h3 className="font-display font-medium text-base text-foreground mb-3">Free Activities & Attractions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeActivities.listings.slice(0, 6).map((listing: any, i: number) => {
                const catSlug = listing.categories?.slug || "";
                const citySlug = listing.cities?.slug || "belfast";
                return (
                  <ListingCard
                    key={listing.id}
                    name={listing.name}
                    slug={listing.slug}
                    citySlug={citySlug}
                    categorySlug={catSlug}
                    shortDescription={listing.short_description || ""}
                    imageUrl={getImageUrl(listing.image_url, listing.image_source, catSlug, citySlug, listing.image_status, listing.name, listing.audience_tags, listing.description)}
                    imageAlt={listing.image_alt || listing.name}
                    rating={listing.rating}
                    reviewCount={listing.review_count ?? 0}
                    priceLevel={listing.price_level}
                    address={listing.address}
                    googleMapsLink={listing.google_maps_link}
                    isFeatured={listing.is_featured}
                    index={i}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          !freeActivities?.events?.length && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground">Free activities for this weekend coming soon.</p>
            </div>
          )
        )}
        <div className="mt-4 text-center">
          <Link to="/free-things-to-do" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline">
            See all free things to do <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ═══════ LAST UPDATED NOTICE ═══════ */}
      <section className="container mx-auto px-4 pb-10">
        <div className="bg-muted/50 border border-border rounded-xl p-5 text-center">
          <p className="text-xs text-muted-foreground">
            This guide is updated every week. Last updated for the weekend of {weekendLabel}.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default WeekendGuidePage;
