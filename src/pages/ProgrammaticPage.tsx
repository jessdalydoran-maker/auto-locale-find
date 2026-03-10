import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

function parseSlug(slug: string) {
  // Parse patterns like "best-restaurants-belfast" or "things-to-do-belfast"
  const parts = slug.replace(/^best-/, "");
  
  // Try to match city at the end
  const cityMatch = parts.match(/-([a-z]+)$/);
  if (!cityMatch) return { categorySlug: parts, citySlug: "" };
  
  const citySlug = cityMatch[1];
  const categorySlug = parts.slice(0, -(citySlug.length + 1));
  
  return { categorySlug, citySlug };
}

const ProgrammaticPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { categorySlug, citySlug } = parseSlug(slug || "");

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
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!categorySlug,
  });

  const { data: listings } = useQuery({
    queryKey: ["programmatic-listings", citySlug, categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("cities.slug", citySlug)
        .eq("categories.slug", categorySlug)
        .order("rating", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!citySlug && !!categorySlug,
  });

  const { data: allCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const title = category && city
    ? `Best ${category.name} in ${city.name}`
    : "Loading...";

  const metaDescription = category && city
    ? `Discover the top ${category.name.toLowerCase()} in ${city.name}. Ratings, reviews, and maps for the best ${category.name.toLowerCase()} near you.`
    : "";

  return (
    <Layout>
      {/* Hero */}
      <section className="hero-gradient py-12 md:py-16">
        <div className="container mx-auto px-4">
          {city && (
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-2">
              <MapPin className="h-4 w-4" />
              <Link to={`/${citySlug}`} className="hover:text-primary-foreground transition-colors">
                {city.name}
              </Link>
            </div>
          )}
          <h1 className="font-display font-bold text-2xl md:text-4xl text-primary-foreground">{title}</h1>
          {metaDescription && (
            <p className="text-primary-foreground/60 text-sm mt-2 max-w-2xl">{metaDescription}</p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AdPlaceholder slot="header" />

        {/* Numbered top 10 list */}
        <div className="my-8">
          <h2 className="font-display font-semibold text-xl text-foreground mb-6">
            Top {listings?.length || 0} {category?.name || "Places"} in {city?.name || ""}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings?.map((listing, i) => (
              <div key={listing.id} className="relative">
                <span className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold card-shadow">
                  {i + 1}
                </span>
                <ListingCard
                  name={listing.name}
                  slug={listing.slug}
                  citySlug={citySlug}
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
              </div>
            ))}
          </div>
        </div>

        {listings?.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>No listings found for this search yet. We're adding new places all the time!</p>
          </div>
        )}

        <AdPlaceholder slot="mid-content" />

        {/* Related searches */}
        <section className="py-12 border-t border-border mt-8">
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">Related Searches</h2>
          <div className="flex flex-wrap gap-2">
            {allCategories
              ?.filter((c) => c.slug !== categorySlug)
              .map((cat) => (
                <Link
                  key={cat.id}
                  to={`/best-${cat.slug}-${citySlug}`}
                  className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Best {cat.name} {city?.name}
                </Link>
              ))}
          </div>
        </section>

        <AdPlaceholder slot="footer" />
      </div>
    </Layout>
  );
};

export default ProgrammaticPage;
