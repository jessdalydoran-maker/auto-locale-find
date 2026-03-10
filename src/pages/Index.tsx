import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { CityCard } from "@/components/CityCard";
import { CategoryPill } from "@/components/CategoryPill";
import { ListingCard } from "@/components/ListingCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

  return (
    <Layout>
      {/* Hero — clean white with subtle border */}
      <section className="bg-card border-b border-border py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-foreground mb-3 leading-tight">
            Discover the Best Places
            <br />
            <span className="text-accent">in Every City</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
            Find top-rated restaurants, cafes, bars, activities and more across the UK's best cities.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar large placeholder="Try 'best restaurants Belfast' or 'things to do London'..." />
          </div>
        </div>
      </section>

      <AdPlaceholder slot="header" />

      {/* Categories */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="font-display font-semibold text-xl text-foreground mb-5">Browse by Category</h2>
        <div className="flex flex-wrap gap-2.5">
          {categories?.map((cat) => (
            <CategoryPill key={cat.id} name={cat.name} slug={cat.slug} icon={cat.icon} />
          ))}
        </div>
      </section>

      {/* Cities */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-xl text-foreground">Explore Cities</h2>
          <Link to="/cities" className="text-sm text-accent font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cities?.map((city, i) => (
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

      <AdPlaceholder slot="mid-content" />

      {/* Featured */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="font-display font-semibold text-xl text-foreground mb-5">Featured Places</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredListings?.map((listing, i) => (
            <ListingCard
              key={listing.id}
              name={listing.name}
              slug={listing.slug}
              citySlug={(listing.cities as any)?.slug || ""}
              shortDescription={listing.short_description || ""}
              rating={listing.rating}
              reviewCount={listing.review_count || 0}
              imageUrl={listing.image_url}
              address={listing.address}
              priceLevel={listing.price_level}
              googleMapsLink={listing.google_maps_link}
              isFeatured={listing.is_featured}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* SEO internal links */}
      <section className="container mx-auto px-4 py-10 border-t border-border">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Popular Searches</h2>
        <div className="flex flex-wrap gap-2">
          {cities?.flatMap((city) =>
            (categories || []).slice(0, 4).map((cat) => (
              <Link
                key={`${city.slug}-${cat.slug}`}
                to={`/best-${cat.slug}-${city.slug}`}
                className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent hover:text-accent transition-colors"
              >
                Best {cat.name} {city.name}
              </Link>
            ))
          )}
          {cities?.slice(0, 3).flatMap((city) =>
            ["cheap", "romantic", "vegan"].map((mod) => (
              <Link
                key={`${mod}-restaurants-${city.slug}`}
                to={`/${mod}-restaurants-${city.slug}`}
                className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent hover:text-accent transition-colors"
              >
                {mod.charAt(0).toUpperCase() + mod.slice(1)} Restaurants {city.name}
              </Link>
            ))
          )}
        </div>
      </section>

      <AdPlaceholder slot="footer" />
    </Layout>
  );
};

export default Index;
