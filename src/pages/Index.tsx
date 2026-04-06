import { useQuery } from "@tanstack/react-query";
import { isLiveMusicEvent, isLiveMusicVenue } from "@/lib/live-music-utils";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { CityCard } from "@/components/CityCard";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { NeighbourhoodCard } from "@/components/NeighbourhoodCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import {
  ArrowRight, Calendar, Utensils, MapPin, Star, Heart,
  TrendingUp, Users, CloudRain, Coins, PartyPopper, Coffee,
  Music, Compass, Beer, Hotel, Baby, ChevronDown, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl, getCategoryPlaceholder, buildImageErrorHandler } from "@/lib/image-utils";
import { filterAndRankListings } from "@/lib/listing-quality";
import { Link, useNavigate } from "react-router-dom";
import { setPageCanonical } from "@/lib/canonical";
import { useEffect, useState } from "react";
import heroBelfast from "@/assets/hero-belfast.jpg";

const BROWSE_CATEGORIES = [
  { label: "Bars & Pubs", icon: Beer, to: "/bars-belfast" },
  { label: "Restaurants", icon: Utensils, to: "/best-restaurants-belfast" },
  { label: "Things To Do", icon: Compass, to: "/things-to-do" },
  { label: "Events", icon: Calendar, to: "/events-this-weekend" },
  { label: "Family Days Out", icon: Baby, to: "/family-activities" },
  { label: "Nightlife", icon: PartyPopper, to: "/nightlife" },
  { label: "Hotels & Stays", icon: Hotel, to: "/belfast/hotels" },
  { label: "Cafes & Coffee", icon: Coffee, to: "/best-cafes-belfast" },
];

const MOOD_CARDS = [
  { label: "Date Night", to: "/date-night", icon: Heart, desc: "Romantic restaurants, cocktail bars & evening activities" },
  { label: "Family Day Out", to: "/family-activities", icon: Users, desc: "Kids activities, parks & family-friendly fun" },
  { label: "Rainy Day Ideas", to: "/rainy-day-activities", icon: CloudRain, desc: "Museums, indoor activities & escape rooms" },
  { label: "Cheap & Free", to: "/free-things-to-do", icon: Coins, desc: "Free events, parks, walks & budget-friendly fun" },
  { label: "Nightlife", to: "/nightlife", icon: PartyPopper, desc: "Bars, clubs, live music & late-night spots" },
  { label: "Brunch & Coffee", to: "/best-brunch-belfast", icon: Coffee, desc: "Top brunch spots, specialty coffee & bakeries" },
];

const Index = () => {
  const navigate = useNavigate();

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: blogPosts } = useQuery({
    queryKey: ["featured-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, featured_image_alt, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(4);
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
        .limit(6);
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

  useEffect(() => {
    setPageCanonical("/");
    document.title = "City Scout Guide — Discover Northern Ireland's Best Kept Secrets";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Your local guide to the best food, drink, events and things to do across Northern Ireland. Discover restaurants, pubs, live music, family activities and hidden gems.");
  }, []);

  return (
    <Layout>
      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[520px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
        <img
          src={heroBelfast}
          alt="Belfast cityscape at dusk"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920} height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 container mx-auto px-4 text-center py-16">
          <h1 className="font-display font-bold text-4xl md:text-6xl text-white mb-4 leading-[1.1] max-w-3xl mx-auto">
            Discover Northern Ireland's Best Kept Secrets
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Your local guide to the best food, drink, events and things to do across Northern Ireland
          </p>

          <div className="max-w-2xl mx-auto">
            <SearchBar large placeholder="What are you looking for?" />
          </div>
        </div>
      </section>

      {/* ═══════ BROWSE BY CATEGORY ═══════ */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-foreground">Browse by Category</h2>
          <p className="text-muted-foreground mt-2">Find exactly what you're looking for</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {BROWSE_CATEGORIES.map((cat, i) => (
            <Link
              key={cat.to}
              to={cat.to}
              className="group flex flex-col items-center gap-3 p-5 bg-card rounded-xl card-shadow hover:card-shadow-hover hover:scale-[1.03] transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <cat.icon className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm font-medium text-foreground text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <AdPlaceholder slot="header" />

      {/* ═══════ FEATURED GUIDES (BLOG) ═══════ */}
      {blogPosts && blogPosts.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display font-bold text-foreground">Featured Guides</h2>
            <Link to="/blog" className="text-sm text-accent font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {blogPosts.map((post, i) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group shrink-0 w-[300px] md:w-[340px] bg-card rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <img
                    src={post.featured_image_url || getCategoryPlaceholder("default", post.title)}
                    alt={post.featured_image_alt || post.title}
                    className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-[11px] text-white/60 font-medium uppercase tracking-wider">Guide</span>
                    <h3 className="font-display font-bold text-white text-base mt-1 line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </div>
                </div>
                {post.excerpt && (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ UPCOMING EVENTS ═══════ */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="py-14 bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 text-accent" />
                Upcoming Events
              </h2>
              <Link to="/events-belfast" className="text-sm text-accent font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((event, i) => (
                <EventCard
                  key={event.id}
                  title={event.title} slug={event.slug}
                  shortDescription={event.short_description}
                  dateStart={event.date_start} dateEnd={event.date_end}
                  timeStart={event.time_start}
                  venueName={event.venue_name} venueAddress={event.venue_address}
                  imageUrl={event.image_url} imageSource={event.image_source}
                  imageAlt={event.image_alt} imageStatus={event.image_status}
                  cityName={(event.cities as any)?.name}
                  isFree={event.is_free} isFamilyFriendly={event.is_family_friendly}
                  ticketUrl={event.ticket_url} price={event.price}
                  tags={event.tags || []} index={i}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ EXPLORE BY MOOD ═══════ */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-foreground">Explore by Mood</h2>
          <p className="text-muted-foreground mt-2">Find the perfect outing for any occasion</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {MOOD_CARDS.map((mood, i) => (
            <Link
              key={mood.to}
              to={mood.to}
              className="group relative bg-card rounded-xl p-5 text-center card-shadow hover:card-shadow-hover hover:scale-[1.03] transition-all duration-300 animate-fade-in flex flex-col items-center gap-3"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                <mood.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-accent transition-colors">{mood.label}</h3>
              <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{mood.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ EXPLORE BY LOCATION ═══════ */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display font-bold text-foreground">Explore by Location</h2>
          <Link to="/cities" className="text-sm text-accent font-semibold flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cities?.slice(0, 6).map((city, i) => (
            <CityCard
              key={city.id}
              name={city.name} slug={city.slug}
              imageUrl={city.image_url}
              description={city.description}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* ═══════ FEATURED PLACES ═══════ */}
      {featuredListings && featuredListings.length > 0 && (
        <section className="py-14 bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display font-bold text-foreground flex items-center gap-2">
                <Star className="h-6 w-6 text-accent" />
                Featured Places
              </h2>
              <Link to="/best-restaurants-belfast" className="text-sm text-accent font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredListings.slice(0, 6).map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  name={listing.name} slug={listing.slug}
                  citySlug={(listing.cities as any)?.slug || ""}
                  shortDescription={listing.short_description || ""}
                  rating={listing.rating} reviewCount={listing.review_count || 0}
                  imageUrl={listing.image_url}
                  imageSource={(listing as any).image_source}
                  imageAlt={(listing as any).image_alt}
                  imageStatus={(listing as any).image_status}
                  categorySlug={(listing.categories as any)?.slug}
                  categoryName={(listing.categories as any)?.name}
                  cityName={(listing.cities as any)?.name}
                  address={listing.address} priceLevel={listing.price_level}
                  googleMapsLink={listing.google_maps_link}
                  isFeatured={listing.is_featured}
                  audienceTags={(listing as any).audience_tags}
                  description={(listing as any).description}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <AdPlaceholder slot="footer" />
    </Layout>
  );
};

export default Index;
