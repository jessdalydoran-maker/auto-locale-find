import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { MapPin, ArrowRight } from "lucide-react";
import { deduplicateListings, filterCompleteListings, validatePage, detectPageType, getRobotsDirective } from "@/lib/page-validation";
import { filterAndRankListings } from "@/lib/listing-quality";
import { useEffect, useMemo } from "react";
import { setPageCanonical } from "@/lib/canonical";

/** Human-friendly intro templates by category slug */
const CATEGORY_INTROS: Record<string, (city: string) => string> = {
  "things-to-do": (c) => `Discover the best things to do in ${c}. From top attractions to hidden gems, here's our curated guide to activities and experiences in ${c}.`,
  restaurants: (c) => `Looking for great places to eat in ${c}? Browse the best restaurants, from casual dining to fine cuisine, all rated and reviewed by locals.`,
  pubs: (c) => `Find the best pubs in ${c}. Whether you're after a cosy local, live music or craft beer, we've rounded up the top spots.`,
  cafes: (c) => `The best cafes and coffee shops in ${c}. Find your perfect spot for brunch, a flat white, or a quiet afternoon.`,
  bars: (c) => `Explore the best bars in ${c}. Cocktail lounges, wine bars, and everything in between.`,
  nightlife: (c) => `Your guide to nightlife in ${c}. Clubs, late bars, DJ nights and more.`,
  "live-music": (c) => `Find live music venues and gigs in ${c}. From intimate sessions to headline shows.`,
  attractions: (c) => `Top attractions and sightseeing spots in ${c}. Plan your visit with our curated list.`,
  parks: (c) => `The best parks and green spaces in ${c} for walks, picnics, and outdoor activities.`,
  museums: (c) => `Discover museums, galleries and cultural venues in ${c}.`,
  shopping: (c) => `The best shopping destinations in ${c}. High street, independent boutiques, and retail parks.`,
  "family-activities": (c) => `Fun things to do with kids in ${c}. Family-friendly activities, soft play, and days out.`,
  hotels: (c) => `Find the best hotels and places to stay in ${c}. From budget-friendly to luxury.`,
  brunch: (c) => `The best brunch spots in ${c}. Weekend brunch, all-day breakfast, and more.`,
  gyms: (c) => `Gyms and fitness centres in ${c}. Find the right workout spot for you.`,
  theatre: (c) => `Theatre and performing arts in ${c}. Shows, plays, and live performances.`,
  markets: (c) => `Markets and food halls in ${c}. Local produce, street food, and weekend markets.`,
};

const DEFAULT_INTRO = (cat: string, city: string) =>
  `Explore the best ${cat.toLowerCase()} in ${city}. Our curated guide features top-rated venues, all reviewed and recommended.`;

const CityCategoryPage = () => {
  const { citySlug = "", slug: categorySlug = "" } = useParams();

  const { data: city } = useQuery({
    queryKey: ["city", citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("slug", citySlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!citySlug,
  });

  const { data: category } = useQuery({
    queryKey: ["category", categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", categorySlug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!categorySlug,
  });

  const { data: allCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["city-category-listings", citySlug, categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("cities.slug", citySlug)
        .eq("categories.slug", categorySlug)
        .order("rating", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data || [];
    },
    enabled: !!citySlug && !!categorySlug && !!city && !!category,
  });

  const cleanListings = useMemo(() => {
    if (!listings) return [];
    const { unique } = deduplicateListings(listings as any);
    const complete = filterCompleteListings(unique);
    return filterAndRankListings(complete as any);
  }, [listings]);

  // SEO
  useEffect(() => {
    if (city && category) {
      document.title = `Best ${category.name} in ${city.name} | City Scout Guide`;
      const desc = CATEGORY_INTROS[categorySlug]?.(city.name) || DEFAULT_INTRO(category.name, city.name);
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = desc;
    }
  }, [city, category, categorySlug]);

  useEffect(() => {
    setPageCanonical(`/${citySlug}/${categorySlug}`);
  }, [citySlug, categorySlug]);

  // Noindex thin pages (0-3 listings)
  const validation = useMemo(() => {
    return validatePage({
      listings: (cleanListings || []) as any,
      pageType: detectPageType({ isNeighbourhood: false, isLandmark: false, isEvents: false, hasModifier: false, categorySlug }),
      hasIntro: true,
      hasSectionHeading: true,
      hasFaq: false,
    });
  }, [cleanListings, categorySlug]);

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

  if (!city || !category) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  const introText = CATEGORY_INTROS[categorySlug]?.(city.name) || DEFAULT_INTRO(category.name, city.name);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <MapPin className="h-4 w-4" />
            <Link to={`/${citySlug}`} className="hover:text-primary transition-colors">{city.name}</Link>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
          <h1 className="font-display font-bold text-xl md:text-3xl text-foreground">
            Best {category.name} in {city.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl leading-relaxed">
            {introText}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Category navigation pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to={`/${citySlug}`}
            className="px-3.5 py-2 rounded-full text-[13px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All
          </Link>
          {allCategories?.filter(c => c.slug !== categorySlug).slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/${citySlug}/${cat.slug}`}
              className="px-3.5 py-2 rounded-full text-[13px] font-medium bg-secondary text-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Listings grid */}
        {cleanListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cleanListings.map((listing: any, i: number) => (
              <ListingCard
                key={listing.id}
                name={listing.name}
                slug={listing.slug}
                citySlug={(listing.cities as any)?.slug || citySlug}
                shortDescription={listing.short_description || ""}
                rating={listing.rating}
                reviewCount={listing.review_count || 0}
                imageUrl={listing.image_url}
                imageSource={listing.image_source}
                imageAlt={listing.image_alt}
                imageStatus={listing.image_status}
                categorySlug={(listing.categories as any)?.slug}
                categoryName={(listing.categories as any)?.name}
                cityName={(listing.cities as any)?.name}
                address={listing.address}
                priceLevel={listing.price_level}
                googleMapsLink={listing.google_maps_link}
                isFeatured={listing.is_featured}
                audienceTags={listing.audience_tags}
                description={listing.description}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No {category.name} listings in {city.name} yet.</p>
            <Link to={`/${citySlug}`} className="text-primary text-sm mt-2 inline-block hover:underline">
              Browse all places in {city.name} →
            </Link>
          </div>
        )}

        {/* Internal links footer */}
        <section className="py-10 border-t border-border mt-10">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Explore More in {city.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {allCategories?.filter(c => c.slug !== categorySlug).map((cat) => (
              <Link
                key={cat.id}
                to={`/${citySlug}/${cat.slug}`}
                className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {cat.name} in {city.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CityCategoryPage;
