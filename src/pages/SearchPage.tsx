import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { parseSearchIntent } from "@/lib/search-intent";
import { Search } from "lucide-react";
import { deduplicateListings, filterCompleteListings } from "@/lib/page-validation";
import { useMemo } from "react";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const intent = parseSearchIntent(query);

  // Main listings query using intent-based matching
  const { data: listings, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      // Strategy 1: Match by resolved categories + city
      if (intent.categorySlugs.length > 0 && intent.city) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id, slug")
          .in("slug", intent.categorySlugs);

        const { data: city } = await supabase
          .from("cities")
          .select("id")
          .eq("slug", intent.city)
          .maybeSingle();

        if (cats?.length && city) {
          const catIds = cats.map((c) => c.id);
          let q = supabase
            .from("listings")
            .select("*, cities!inner(slug, name), categories!inner(slug, name)")
            .in("category_id", catIds)
            .eq("city_id", city.id)
            .order("rating", { ascending: false })
            .limit(30);

          const { data } = await q;
          if (data && data.length > 0) return data;
        }
      }

      // Strategy 2: Text search fallback with broader matching
      const textTerms = intent.keywords.length > 0
        ? intent.keywords
        : query.split(/\s+/).filter((w) => w.length > 2);

      if (textTerms.length > 0) {
        const orClauses = textTerms
          .map((t) => `name.ilike.%${t}%,short_description.ilike.%${t}%,description.ilike.%${t}%,address.ilike.%${t}%`)
          .join(",");

        const { data } = await supabase
          .from("listings")
          .select("*, cities!inner(slug, name), categories!inner(slug, name)")
          .or(orClauses)
          .order("rating", { ascending: false })
          .limit(20);

        if (data && data.length > 0) return data;
      }

      // Strategy 3: If city matched, show top listings for that city
      if (intent.city) {
        const { data: city } = await supabase
          .from("cities")
          .select("id")
          .eq("slug", intent.city)
          .maybeSingle();

        if (city) {
          const { data } = await supabase
            .from("listings")
            .select("*, cities!inner(slug, name), categories!inner(slug, name)")
            .eq("city_id", city.id)
            .order("rating", { ascending: false })
            .limit(20);

          return data || [];
        }
      }

      return [];
    },
    enabled: !!query,
  });

  // Fetch related programmatic pages
  const { data: relatedPages } = useQuery({
    queryKey: ["search-pages", query],
    queryFn: async () => {
      if (intent.suggestedPages.length === 0) return [];
      const { data } = await supabase
        .from("programmatic_pages")
        .select("slug, title, listing_count")
        .in("slug", intent.suggestedPages)
        .eq("is_active", true)
        .gt("listing_count", 0)
        .order("listing_count", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!query && intent.suggestedPages.length > 0,
  });

  // Deduplicate search results
  const dedupedListings = useMemo(() => {
    if (!listings) return [];
    const { unique } = deduplicateListings(listings as any);
    return filterCompleteListings(unique);
  }, [listings]);

  const hasResults = dedupedListings.length > 0;
  const hasRelatedPages = relatedPages && relatedPages.length > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mb-8">
          <SearchBar large placeholder="Search..." />
        </div>

        <h1 className="font-display font-bold text-2xl text-foreground mb-2">
          {query ? `Results for "${query}"` : "Search"}
        </h1>

        {/* Intent debug info - show what we understood */}
        {query && intent.categorySlugs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {intent.categorySlugs.slice(0, 5).map((cat) => (
              <span key={cat} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {cat.replace(/-/g, " ")}
              </span>
            ))}
            {intent.city && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {intent.city}
              </span>
            )}
            {intent.modifiers.map((m) => (
              <span key={m} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                {m}
              </span>
            ))}
          </div>
        )}

        {/* Related pages */}
        {hasRelatedPages && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">Related pages</p>
            <div className="flex flex-wrap gap-2">
              {relatedPages!.map((page) => (
                <Link
                  key={page.slug}
                  to={`/${page.slug}`}
                  className="text-sm bg-card border border-border px-3 py-1.5 rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {page.title} ({page.listing_count})
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          {isLoading ? "Searching..." : `${dedupedListings.length} places found`}
        </p>

        {/* Results grid */}
        {hasResults && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings!.map((listing, i) => (
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
                imageStatus={(listing as any).image_status}
                imageAlt={(listing as any).image_alt}
                categorySlug={(listing.categories as any)?.slug}
                categoryName={(listing.categories as any)?.name}
                cityName={(listing.cities as any)?.name}
                address={listing.address}
                priceLevel={listing.price_level}
                googleMapsLink={listing.google_maps_link}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Zero-result protection */}
        {!isLoading && !hasResults && query && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">
              No exact matches found. Try one of these popular searches:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "best restaurants Belfast",
                "things to do Belfast",
                "cafes Belfast",
                "events Belfast",
                "bars Belfast",
                "family activities Belfast",
              ].map((suggestion) => (
                <Link
                  key={suggestion}
                  to={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="text-sm bg-card border border-border px-3 py-1.5 rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
