import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingGrid } from "@/components/ListingGrid";
import { MapPin, ArrowRight } from "lucide-react";
import { deduplicateListings, filterCompleteListings, validatePage, detectPageType, getRobotsDirective } from "@/lib/page-validation";
import { filterAndRankListings } from "@/lib/listing-quality";
import { useEffect, useMemo } from "react";
import { setPageCanonical } from "@/lib/canonical";

const CATEGORY_INTROS: Record<string, (city: string) => string> = {
  "things-to-do": (c) => `Discover the best things to do in ${c}. From top attractions to hidden gems, here's our curated guide.`,
  restaurants: (c) => `Looking for great places to eat in ${c}? Browse the best restaurants, from casual dining to fine cuisine.`,
  pubs: (c) => `Find the best pubs in ${c}. Whether you're after a cosy local, live music or craft beer.`,
  cafes: (c) => `The best cafes and coffee shops in ${c}. Find your perfect spot for brunch or a flat white.`,
  bars: (c) => `Explore the best bars in ${c}. Cocktail lounges, wine bars, and everything in between.`,
  nightlife: (c) => `Your guide to nightlife in ${c}. Clubs, late bars, DJ nights and more.`,
  "live-music": (c) => `Find live music venues and gigs in ${c}. From intimate sessions to headline shows.`,
  attractions: (c) => `Top attractions and sightseeing spots in ${c}. Plan your visit with our curated list.`,
  parks: (c) => `The best parks and green spaces in ${c} for walks, picnics, and outdoor activities.`,
  museums: (c) => `Discover museums, galleries and cultural venues in ${c}.`,
  shopping: (c) => `The best shopping destinations in ${c}.`,
  "family-activities": (c) => `Fun things to do with kids in ${c}. Family-friendly activities and days out.`,
  hotels: (c) => `Find the best hotels and places to stay in ${c}.`,
  brunch: (c) => `The best brunch spots in ${c}. Weekend brunch, all-day breakfast, and more.`,
  gyms: (c) => `Gyms and fitness centres in ${c}.`,
  theatre: (c) => `Theatre and performing arts in ${c}.`,
  markets: (c) => `Markets and food halls in ${c}.`,
};

const DEFAULT_INTRO = (cat: string, city: string) => `Explore the best ${cat.toLowerCase()} in ${city}. Our curated guide features top-rated venues.`;

const CityCategoryPage = () => {
  const { citySlug = "", slug: categorySlug = "" } = useParams();

  const { data: city } = useQuery({
    queryKey: ["city", citySlug],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").eq("slug", citySlug).single();
      if (error) throw error; return data;
    },
    enabled: !!citySlug,
  });

  const { data: category } = useQuery({
    queryKey: ["category", categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("slug", categorySlug).eq("is_active", true).single();
      if (error) throw error; return data;
    },
    enabled: !!categorySlug,
  });

  const { data: allCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error; return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["city-category-listings", citySlug, categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings").select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("cities.slug", citySlug).eq("categories.slug", categorySlug)
        .order("rating", { ascending: false }).limit(60);
      if (error) throw error; return data || [];
    },
    enabled: !!citySlug && !!categorySlug && !!city && !!category,
  });

  const cleanListings = useMemo(() => {
    if (!listings) return [];
    const { unique } = deduplicateListings(listings as any);
    return filterAndRankListings(filterCompleteListings(unique) as any);
  }, [listings]);

  useEffect(() => {
    if (city && category) {
      document.title = `Best ${category.name} in ${city.name} | City Scout Guide`;
      const desc = CATEGORY_INTROS[categorySlug]?.(city.name) || DEFAULT_INTRO(category.name, city.name);
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
      meta.content = desc;
    }
  }, [city, category, categorySlug]);

  useEffect(() => { setPageCanonical(`/${citySlug}/${categorySlug}`); }, [citySlug, categorySlug]);

  const validation = useMemo(() => validatePage({
    listings: (cleanListings || []) as any,
    pageType: detectPageType({ isNeighbourhood: false, isLandmark: false, isEvents: false, hasModifier: false, categorySlug }),
    hasIntro: true, hasSectionHeading: true, hasFaq: false,
  }), [cleanListings, categorySlug]);

  useEffect(() => {
    const d = getRobotsDirective(validation);
    let el = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (d) { if (!el) { el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); } el.content = d; }
    else if (el) el.remove();
  }, [validation]);

  if (!city || !category) return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  const introText = CATEGORY_INTROS[categorySlug]?.(city.name) || DEFAULT_INTRO(category.name, city.name);

  return (
    <Layout>
      {/* Hero banner */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-primary-foreground/50 text-sm mb-2">
            <MapPin className="h-4 w-4" />
            <Link to={`/${citySlug}`} className="hover:text-primary-foreground transition-colors">{city.name}</Link>
            <span>/</span>
            <span className="text-primary-foreground/80">{category.name}</span>
          </nav>
          <h1 className="font-display font-bold text-primary-foreground">Best {category.name} in {city.name}</h1>
          <p className="text-primary-foreground/60 text-sm mt-2 max-w-2xl leading-relaxed">{introText}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Category pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <Link to={`/${citySlug}`} className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">← All</Link>
          {allCategories?.filter(c => c.slug !== categorySlug).slice(0, 8).map((cat) => (
            <Link key={cat.id} to={`/${citySlug}/${cat.slug}`}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
              {cat.name}
            </Link>
          ))}
        </div>

        {cleanListings.length > 0 ? (
          <ListingGrid listings={cleanListings} citySlug={citySlug} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No {category.name} listings in {city.name} yet.</p>
            <Link to={`/${citySlug}`} className="text-accent text-sm mt-2 inline-block hover:underline">Browse all places in {city.name} →</Link>
          </div>
        )}

        <section className="py-10 border-t border-border mt-10">
          <h2 className="font-display font-bold text-foreground mb-4">Explore More in {city.name}</h2>
          <div className="flex flex-wrap gap-2">
            {allCategories?.filter(c => c.slug !== categorySlug).map((cat) => (
              <Link key={cat.id} to={`/${citySlug}/${cat.slug}`}
                className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
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
