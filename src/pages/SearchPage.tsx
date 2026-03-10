import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: listings } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%,address.ilike.%${query}%`)
        .order("rating", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!query,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mb-8">
          <SearchBar large placeholder="Search..." />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">
          {query ? `Results for "${query}"` : "Search"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {listings?.length || 0} places found
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map((listing, i) => (
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
              index={i}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
