import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { CityCard } from "@/components/CityCard";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { NeighbourhoodCard } from "@/components/NeighbourhoodCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArrowRight, Calendar, Utensils, MapPin, Star, Sparkles, Heart, TrendingUp, Moon, Users, CloudRain, Coins, PartyPopper, Coffee, Plus, Rainbow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl, getCategoryPlaceholder, buildImageErrorHandler } from "@/lib/image-utils";
import { Link } from "react-router-dom";
import { setPageCanonical } from "@/lib/canonical";
import { useEffect } from "react";

const QUICK_LINKS = [
  { label: "What's On", to: "/events", icon: Calendar },
  { label: "Things To Do", to: "/things-to-do", icon: Sparkles },
  { label: "LGBT+", to: "/belfast?category=lgbtq", icon: Rainbow },
  { label: "Restaurants", to: "/best-restaurants-belfast", icon: Utensils },
  { label: "Free", to: "/free-things-to-do", icon: Star },
  { label: "Date Night", to: "/date-night", icon: Heart },
  { label: "This Weekend", to: "/things-to-do-this-weekend", icon: Calendar },
];

const POPULAR_SEARCHES = [
  { label: "What's on this weekend", to: "/events-this-weekend" },
  { label: "Free events", to: "/free-events" },
  { label: "Family activities", to: "/family-activities" },
  { label: "Best restaurants Belfast", to: "/best-restaurants-belfast" },
  { label: "Best brunch Belfast", to: "/best-brunch-belfast" },
  { label: "Date night", to: "/date-night" },
  { label: "Live music tonight", to: "/live-music-tonight" },
  { label: "Things to do today", to: "/things-to-do-today" },
  { label: "Best cafes Belfast", to: "/best-cafes-belfast" },
  { label: "Cocktail bars Belfast", to: "/cocktail-bars-belfast" },
  { label: "Things to do Cathedral Quarter", to: "/things-to-do-cathedral-quarter-belfast" },
  { label: "Restaurants Titanic Quarter", to: "/restaurants-titanic-quarter-belfast" },
];

const Index = () => {
  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: featuredListings } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("is_featured", true)
        .eq("cities.slug", "belfast")
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("*, cities!inner(slug, name)")
        .eq("status", "active")
        .eq("cities.slug", "belfast")
        .gte("date_start", today)
        .order("date_start", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: belfastNeighbourhoods } = useQuery({
    queryKey: ["belfast-neighbourhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighbourhoods")
        .select("*, cities!inner(slug)")
        .eq("is_active", true)
        .eq("cities.slug", "belfast");
      if (error) throw error;
      return data;
    },
  });

  // Trending This Weekend: events + popular listings for Belfast
  const { data: weekendItems } = useQuery({
    queryKey: ["weekend-trending"],
    queryFn: async () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const friday = new Date(now);
      if (dayOfWeek === 5) friday.setDate(now.getDate());
      else if (dayOfWeek === 6) friday.setDate(now.getDate() - 1);
      else if (dayOfWeek === 0) friday.setDate(now.getDate() - 2);
      else friday.setDate(now.getDate() + ((5 - dayOfWeek + 7) % 7));
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      const friStr = friday.toISOString().split("T")[0];
      const sunStr = sunday.toISOString().split("T")[0];

      // Fetch weekend events — Belfast only
      const { data: events } = await supabase
        .from("events")
        .select("id, title, slug, short_description, date_start, image_url, image_source, image_alt, is_free, venue_name, cities!inner(slug, name), category_id")
        .eq("status", "active")
        .eq("cities.slug", "belfast")
        .gte("date_start", friStr)
        .lte("date_start", sunStr)
        .order("date_start", { ascending: true })
        .limit(4);

      // Fetch popular listings to supplement — Belfast only
      const { data: listings } = await supabase
        .from("listings")
        .select("id, name, slug, short_description, rating, image_url, image_source, image_alt, image_status, address, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("is_approved", true)
        .eq("cities.slug", "belfast")
        .order("rating", { ascending: false })
        .limit(4);

      // Combine into a unified "weekend card" list
      const items: Array<{
        id: string; title: string; slug: string; description: string;
        imageUrl: string | null; imageSource: string | null; imageAlt: string | null;
        category: string; citySlug: string; type: "event" | "listing"; link: string;
        badge?: string;
      }> = [];

      for (const e of (events || [])) {
        items.push({
          id: e.id, title: e.title, slug: e.slug,
          description: e.short_description || "",
          imageUrl: e.image_url, imageSource: e.image_source as string | null, imageAlt: e.image_alt as string | null,
          category: "Event", citySlug: (e.cities as any)?.slug || "belfast",
          type: "event", link: `/event/${e.slug}`,
          badge: e.is_free ? "Free" : undefined,
        });
      }

      for (const l of (listings || [])) {
        items.push({
          id: l.id, title: l.name, slug: l.slug,
          description: l.short_description || "",
          imageUrl: l.image_url, imageSource: l.image_source as string | null, imageAlt: l.image_alt as string | null,
          category: (l.categories as any)?.name || "Place",
          citySlug: (l.cities as any)?.slug || "belfast",
          type: "listing", link: `/place/${l.slug}`,
        });
      }

      return items.slice(0, 8);
    },
  });

  // Tonight Near You: events + nightlife + live music happening today
  const { data: tonightItems } = useQuery({
    queryKey: ["tonight-near-you"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      // Today's events across NI
      const { data: todayEvents } = await supabase
        .from("events")
        .select("id, title, slug, short_description, date_start, time_start, image_url, image_source, image_alt, image_status, is_free, venue_name, tags, cities!inner(slug, name)")
        .eq("status", "active")
        .eq("date_start", today)
        .order("time_start", { ascending: true })
        .limit(12);

      // Also fetch nightlife/bars listings for "tonight" feel
      const { data: nightlifeListings } = await supabase
        .from("listings")
        .select("id, name, slug, short_description, image_url, image_source, image_alt, image_status, address, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("is_approved", true)
        .in("categories.slug", ["bars", "cocktail-bars", "nightlife", "live-music"])
        .order("rating", { ascending: false })
        .limit(4);

      const items: Array<{
        id: string; title: string; slug: string; description: string;
        imageUrl: string | null; imageSource: string | null; imageAlt: string | null; imageStatus: string;
        cityName: string; citySlug: string; type: "event" | "listing"; link: string;
        badge?: string; time?: string | null; tags?: string[];
      }> = [];

      for (const e of (todayEvents || [])) {
        items.push({
          id: e.id, title: e.title, slug: e.slug,
          description: e.short_description || "",
          imageUrl: e.image_url, imageSource: e.image_source as string | null,
          imageAlt: e.image_alt as string | null, imageStatus: e.image_status || "needs_review",
          cityName: (e.cities as any)?.name || "", citySlug: (e.cities as any)?.slug || "",
          type: "event", link: `/event/${e.slug}`,
          badge: e.is_free ? "Free" : undefined,
          time: e.time_start, tags: e.tags || [],
        });
      }

      for (const l of (nightlifeListings || [])) {
        items.push({
          id: l.id, title: l.name, slug: l.slug,
          description: l.short_description || "",
          imageUrl: l.image_url, imageSource: l.image_source as string | null,
          imageAlt: l.image_alt as string | null, imageStatus: l.image_status || "needs_review",
          cityName: (l.cities as any)?.name || "", citySlug: (l.cities as any)?.slug || "",
          type: "listing", link: `/${(l.cities as any)?.slug || "belfast"}/${l.slug}`,
          tags: [],
        });
      }

      // Deduplicate
      const seen = new Set<string>();
      return items.filter(i => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      }).slice(0, 8);
    },
  });

  useEffect(() => { setPageCanonical("/"); }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-14 md:py-20 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium mb-5">
            <MapPin className="h-3 w-3" />
            Northern Ireland's Local Discovery Platform
          </div>
          <h1 className="font-display font-bold text-3xl md:text-[2.75rem] text-foreground mb-4 leading-[1.15] tracking-tight max-w-2xl mx-auto">
            Find Things To Do Across Northern Ireland
          </h1>
          <p className="text-muted-foreground text-[15px] md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Discover events, markets, restaurants, family activities and hidden gems near you.
          </p>
          <div className="max-w-lg mx-auto mb-8">
            <SearchBar large placeholder="Search by event, place, town or category..." />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-colors ${
                  link.label === "LGBT+"
                    ? "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                    : "bg-secondary text-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex justify-center gap-3">
            <Link to="/submit-venue">
              <Button variant="outline" size="sm" className="text-[13px] gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Submit a Venue
              </Button>
            </Link>
            <Link to="/suggest-event">
              <Button variant="outline" size="sm" className="text-[13px] gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Suggest an Event
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <AdPlaceholder slot="header" />

      {/* Popular Belfast Searches */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Popular Belfast Searches</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {POPULAR_SEARCHES.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="px-3.5 py-2.5 bg-card border border-border rounded-lg text-[13px] text-foreground hover:border-primary/40 hover:text-primary transition-colors card-shadow"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Belfast Highlights — Editorial */}
      {featuredListings && featuredListings.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">Belfast Highlights</h2>
              <p className="text-sm text-muted-foreground mt-1">Curated places and experiences we recommend</p>
            </div>
            <Link to="/things-to-do" className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
              Explore more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredListings.slice(0, 6).map((listing, i) => {
              const catSlug = (listing.categories as any)?.slug;
              const catName = (listing.categories as any)?.name || "Place";
              const citySlug = (listing.cities as any)?.slug || "belfast";
               const imgSrc = getImageUrl(listing.image_url, (listing as any).image_source, catSlug, citySlug, (listing as any).image_status, listing.name, (listing as any).audience_tags, listing.description);
               return (
                <Link
                  key={listing.id}
                  to={`/${citySlug}/${listing.slug}`}
                  className="group bg-card rounded-xl border border-border overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={(listing as any).image_alt || `${listing.name} — ${catName} in Belfast`}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                      width={600}
                      height={400}
                      onError={buildImageErrorHandler(catSlug, listing.name, (listing as any).audience_tags, listing.description)}
                    />
                    <span className="absolute top-3 left-3 bg-teal text-teal-foreground text-[11px] font-semibold px-2.5 py-1 rounded-md">
                      {catName}
                    </span>
                    {listing.rating && listing.rating > 0 && (
                      <span className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-foreground text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {listing.rating}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-base text-foreground group-hover:text-primary transition-colors mb-1.5">
                      {listing.name}
                    </h3>
                    <p className="text-[13px] text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                      {listing.description || listing.short_description || `One of Belfast's top ${catName.toLowerCase()} — a must-visit for locals and visitors alike.`}
                    </p>
                    {listing.address && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{listing.address}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { label: "Things To Do", to: "/things-to-do" },
              { label: "Best Restaurants Belfast", to: "/best-restaurants-belfast" },
              { label: "Best Cafes Belfast", to: "/best-cafes-belfast" },
              { label: "Bars Belfast", to: "/bars-belfast" },
              { label: "This Weekend", to: "/things-to-do-this-weekend" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs px-3 py-1.5 bg-secondary text-foreground rounded-full hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending This Weekend */}
      {weekendItems && weekendItems.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal" />
              Trending This Weekend
            </h2>
            <Link to="/things-to-do-this-weekend" className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weekendItems.map((item, i) => (
              <Link
                key={item.id}
                to={item.link}
                className="group bg-card rounded-lg border border-border overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={item.imageUrl || getCategoryPlaceholder(item.category.toLowerCase(), item.title)}
                    alt={item.imageAlt || `${item.title} — ${item.category} in Belfast`}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={250}
                    onError={buildImageErrorHandler(item.category.toLowerCase(), item.title)}
                  />
                  <span className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm text-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  {item.badge && (
                    <span className="absolute top-2 right-2 bg-teal text-teal-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-display font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tonight Near You */}
      {tonightItems && tonightItems.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-teal" />
              Tonight Near You
            </h2>
            <Link to="/events-tonight" className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tonightItems.map((item, i) => (
              <Link
                key={item.id}
                to={item.link}
                className="group bg-card rounded-lg border border-border overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={item.imageUrl || getCategoryPlaceholder(item.type === "event" ? "events" : "nightlife", item.title)}
                    alt={item.imageAlt || `${item.title} — Tonight in ${item.cityName}`}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={250}
                    onError={buildImageErrorHandler(item.type === "event" ? "events" : "nightlife", item.title)}
                  />
                  <span className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm text-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
                    {item.type === "event" ? "Event" : "Venue"}
                  </span>
                  {item.badge && (
                    <span className="absolute top-2 right-2 bg-teal text-teal-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.time && (
                    <span className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
                      {item.time.slice(0, 5)}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-display font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  {item.cityName && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.cityName}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}


      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-foreground">Upcoming Events</h2>
            <Link to="/events-belfast" className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event, i) => (
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

      {/* Featured Neighbourhoods - Belfast */}
      {belfastNeighbourhoods && belfastNeighbourhoods.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">Explore Belfast Neighbourhoods</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {belfastNeighbourhoods.map((nb, i) => (
              <NeighbourhoodCard
                key={nb.id}
                name={nb.name}
                slug={nb.slug}
                citySlug={(nb.cities as any)?.slug || "belfast"}
                description={nb.description}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      <AdPlaceholder slot="mid-content" />

      {/* Cities */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-lg text-foreground">Explore Cities</h2>
          <Link to="/cities" className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities?.slice(0, 6).map((city, i) => (
            <CityCard
              key={city.id}
              name={city.name}
              slug={city.slug}
              imageUrl={city.image_url}
              description={city.description}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Featured Places */}
      {featuredListings && featuredListings.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-foreground">Featured Places</h2>
            <Link to="/best-restaurants-belfast" className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredListings.map((listing, i) => (
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
            ))}
          </div>
        </section>
      )}

      {/* Explore Belfast by Mood */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">Explore by Mood</h2>
          <p className="text-sm text-muted-foreground mt-1">Find the perfect outing for any occasion</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Date Night", to: "/date-night", icon: Heart, desc: "Romantic restaurants, cocktail bars & evening activities", color: "hsl(var(--accent))" },
            { label: "Family Day Out", to: "/family-activities", icon: Users, desc: "Kids activities, parks & family-friendly attractions", color: "hsl(var(--accent))" },
            { label: "Rainy Day Ideas", to: "/rainy-day-activities", icon: CloudRain, desc: "Museums, indoor activities, cafes & escape rooms", color: "hsl(var(--accent))" },
            { label: "Cheap & Free", to: "/free-things-to-do", icon: Coins, desc: "Free events, parks, walks & budget-friendly fun", color: "hsl(var(--accent))" },
            { label: "Nightlife", to: "/nightlife", icon: PartyPopper, desc: "Bars, clubs, live music & late-night spots", color: "hsl(var(--accent))" },
            { label: "Brunch & Coffee", to: "/best-brunch-belfast", icon: Coffee, desc: "Top brunch spots, specialty coffee & bakeries", color: "hsl(var(--accent))" },
          ].map((mood, i) => (
            <Link
              key={mood.to}
              to={mood.to}
              className="group bg-card border border-border rounded-xl p-4 text-center card-shadow hover:card-shadow-hover hover:border-primary/40 transition-all duration-200 animate-fade-in flex flex-col items-center gap-2.5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-11 h-11 rounded-full bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                <mood.icon className="h-5 w-5 text-teal" />
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                {mood.label}
              </h3>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                {mood.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* SEO Internal Links */}
      <section className="container mx-auto px-4 py-10 border-t border-border">
        <h2 className="font-display font-semibold text-base text-foreground mb-4">More Searches</h2>
        <div className="flex flex-wrap gap-1.5">
          {cities?.slice(0, 4).flatMap((city) =>
            (categories || []).slice(0, 5).map((cat) => (
              <Link
                key={`${city.slug}-${cat.slug}`}
                to={`/best-${cat.slug}-${city.slug}`}
                className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-primary/40 hover:text-primary transition-colors"
              >
                Best {cat.name} {city.name}
              </Link>
            ))
          )}
          {["free-things-to-do", "family-activities", "date-night", "live-music", "nightlife"].map((combo) => (
            <Link
              key={combo}
              to={`/${combo}`}
              className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-primary/40 hover:text-primary transition-colors"
            >
              {combo.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4 py-10">
        <div className="bg-card border border-border rounded-xl p-8 md:p-10 text-center card-shadow">
          <h2 className="font-display font-semibold text-lg text-foreground mb-2">Stay in the Loop</h2>
          <p className="text-muted-foreground text-[13px] mb-6 max-w-md mx-auto leading-relaxed">
            Get the best events, things to do and places to eat delivered to your inbox every week.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <AdPlaceholder slot="footer" />
    </Layout>
  );
};

export default Index;
