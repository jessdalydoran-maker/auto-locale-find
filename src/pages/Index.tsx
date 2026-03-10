import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { CityCard } from "@/components/CityCard";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { NeighbourhoodCard } from "@/components/NeighbourhoodCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArrowRight, Calendar, Utensils, MapPin, Star, Sparkles, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const QUICK_LINKS = [
  { label: "What's On", to: "/events-belfast", icon: Calendar },
  { label: "Things To Do", to: "/things-to-do-belfast", icon: Sparkles },
  { label: "Restaurants", to: "/best-restaurants-belfast", icon: Utensils },
  { label: "Free", to: "/free-things-to-do-belfast", icon: Star },
  { label: "Date Night", to: "/date-night-belfast", icon: Heart },
  { label: "This Weekend", to: "/things-to-do-belfast-this-weekend", icon: Calendar },
];

const POPULAR_SEARCHES = [
  { label: "What's on this weekend", to: "/events-belfast-this-weekend" },
  { label: "Free events Belfast", to: "/free-events-belfast" },
  { label: "Family activities", to: "/family-activities-belfast" },
  { label: "Best restaurants Belfast", to: "/best-restaurants-belfast" },
  { label: "Best brunch Belfast", to: "/best-brunch-belfast" },
  { label: "Date night Belfast", to: "/date-night-belfast" },
  { label: "Live music tonight", to: "/live-music-belfast-tonight" },
  { label: "Things to do today", to: "/things-to-do-belfast-today" },
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

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <h1 className="font-display font-bold text-3xl md:text-[2.75rem] text-foreground mb-3 leading-[1.15] tracking-tight">
            Discover the Best of
            <br />
            <span className="text-accent">Belfast & Northern Ireland</span>
          </h1>
          <p className="text-muted-foreground text-[15px] md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Find events, things to do, restaurants, cafes, bars and hidden gems across Belfast and beyond.
          </p>
          <div className="max-w-lg mx-auto mb-8">
            <SearchBar large placeholder="Search events, restaurants, things to do..." />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-muted-foreground rounded-full text-[13px] font-medium hover:text-accent hover:bg-accent/8 transition-colors"
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
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
              className="px-3.5 py-2.5 bg-card border border-border rounded-lg text-[13px] text-foreground hover:border-accent/40 hover:text-accent transition-colors card-shadow"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-foreground">Upcoming Events</h2>
            <Link to="/events-belfast" className="text-[13px] text-accent font-medium flex items-center gap-1 hover:underline">
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
          <Link to="/cities" className="text-[13px] text-accent font-medium flex items-center gap-1 hover:underline">
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
            <Link to="/best-restaurants-belfast" className="text-[13px] text-accent font-medium flex items-center gap-1 hover:underline">
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

      {/* SEO Internal Links */}
      <section className="container mx-auto px-4 py-10 border-t border-border">
        <h2 className="font-display font-semibold text-base text-foreground mb-4">More Searches</h2>
        <div className="flex flex-wrap gap-1.5">
          {cities?.slice(0, 4).flatMap((city) =>
            (categories || []).slice(0, 5).map((cat) => (
              <Link
                key={`${city.slug}-${cat.slug}`}
                to={`/best-${cat.slug}-${city.slug}`}
                className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent/40 hover:text-accent transition-colors"
              >
                Best {cat.name} {city.name}
              </Link>
            ))
          )}
          {["free-things-to-do", "family-activities", "date-night", "live-music", "nightlife"].map((combo) => (
            <Link
              key={combo}
              to={`/${combo}-belfast`}
              className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent/40 hover:text-accent transition-colors"
            >
              {combo.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Belfast
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
            <button className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
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
