import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { CategoryPill } from "@/components/CategoryPill";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { MapPin } from "lucide-react";

const CityPage = () => {
  const { citySlug, "*": wildcard } = useParams();
  // Support both /:citySlug and /* routing
  const resolvedCitySlug = citySlug || wildcard || "";
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const { data: city } = useQuery({
    queryKey: ["city", citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("slug", citySlug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!citySlug,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["city-listings", citySlug, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("cities.slug", citySlug!);

      if (categoryFilter) {
        query = query.eq("categories.slug", categoryFilter);
      }

      query = query.order("rating", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!citySlug,
  });

  if (!city) return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  const activeCategory = categories?.find((c) => c.slug === categoryFilter);
  const pageTitle = activeCategory
    ? `Best ${activeCategory.name} in ${city.name}`
    : `Best Places in ${city.name}`;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={city.image_url || "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200"}
          alt={city.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6 container mx-auto">
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1">
            <MapPin className="h-4 w-4" />
            <span>{city.country}</span>
          </div>
          <h1 className="font-display font-bold text-2xl md:text-4xl text-primary-foreground">{pageTitle}</h1>
          {city.description && (
            <p className="text-primary-foreground/70 text-sm mt-2 max-w-xl">{city.description}</p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AdPlaceholder slot="header" />

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 my-6">
          <Link
            to={`/${citySlug}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !categoryFilter
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </Link>
          {categories?.map((cat) => (
            <Link
              key={cat.id}
              to={`/${citySlug}?category=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat.slug
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Listings grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map((listing, i) => (
            <ListingCard
              key={listing.id}
              name={listing.name}
              slug={listing.slug}
              citySlug={citySlug!}
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

        {listings?.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>No listings found. Check back soon!</p>
          </div>
        )}

        <AdPlaceholder slot="mid-content" />

        {/* Internal links */}
        <section className="py-12 border-t border-border mt-12">
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">
            More in {city.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/best-${cat.slug}-${citySlug}`}
                className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Best {cat.name} {city.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CityPage;
