import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { SearchBar } from "@/components/SearchBar";
import { parseSearchIntent } from "@/lib/search-intent";
import { scoreListing, scoreEvent, rankAndFilter } from "@/lib/search-scoring";
import { Search, Calendar } from "lucide-react";
import { deduplicateListings, filterCompleteListings } from "@/lib/page-validation";
import { useMemo } from "react";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const intent = parseSearchIntent(query);

  // Fetch all candidate listings (broad search, then score client-side)
  const { data: rawListings, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      const allResults: any[] = [];

      // 1. Exact name search (top priority)
      const { data: exactMatches } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .ilike("name", `%${query.trim()}%`)
        .limit(20);
      if (exactMatches) allResults.push(...exactMatches);

      // 2. Category + city intent match
      if (intent.categorySlugs.length > 0) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id, slug")
          .in("slug", intent.categorySlugs);

        let cityId: string | null = null;
        if (intent.city) {
          const { data: city } = await supabase
            .from("cities")
            .select("id")
            .eq("slug", intent.city)
            .maybeSingle();
          cityId = city?.id || null;
        }

        if (cats?.length) {
          const catIds = cats.map(c => c.id);
          let q = supabase
            .from("listings")
            .select("*, cities!inner(slug, name), categories!inner(slug, name)")
            .in("category_id", catIds)
            .limit(40);
          if (cityId) q = q.eq("city_id", cityId);
          const { data } = await q;
          if (data) allResults.push(...data);
        }

        // Also search by audience_tags for cross-category discovery
        if (cats?.length) {
          const tagSlugs = intent.categorySlugs.slice(0, 5);
          for (const tag of tagSlugs) {
            let q = supabase
              .from("listings")
              .select("*, cities!inner(slug, name), categories!inner(slug, name)")
              .contains("audience_tags", [tag])
              .limit(20);
            if (cityId) q = q.eq("city_id", cityId);
            const { data } = await q;
            if (data) allResults.push(...data);
          }
        }
      }

      // 3. Text search on remaining keywords
      const textTerms = queryWords.filter(w => w.length > 2);
      if (textTerms.length > 0) {
        const orClauses = textTerms
          .map(t => `name.ilike.%${t}%,short_description.ilike.%${t}%,description.ilike.%${t}%`)
          .join(",");

        const { data } = await supabase
          .from("listings")
          .select("*, cities!inner(slug, name), categories!inner(slug, name)")
          .or(orClauses)
          .limit(30);
        if (data) allResults.push(...data);
      }

      // Deduplicate by id
      const seen = new Set<string>();
      return allResults.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    },
    enabled: !!query,
  });

  // Score and rank listings
  const rankedListings = useMemo(() => {
    if (!rawListings?.length) return [];
    const scored = rawListings.map(item => ({
      item,
      score: scoreListing(item, query, intent),
    }));
    const ranked = rankAndFilter(scored, 20);
    const { unique } = deduplicateListings(ranked as any);
    return filterCompleteListings(unique);
  }, [rawListings, query]);

  // Search events with scoring
  const { data: eventResults } = useQuery({
    queryKey: ["search-events", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const today = new Date().toISOString().split("T")[0];
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      const allEvents: any[] = [];

      // Exact title match
      const { data: exactEvents } = await supabase
        .from("events")
        .select("*, cities!inner(slug, name)")
        .eq("status", "active")
        .gte("date_start", today)
        .ilike("title", `%${query.trim()}%`)
        .limit(12);
      if (exactEvents) allEvents.push(...exactEvents);

      // Text search
      const textTerms = queryWords.filter(w => w.length > 2);
      if (textTerms.length > 0) {
        const orClauses = textTerms
          .map(t => `title.ilike.%${t}%,short_description.ilike.%${t}%,venue_name.ilike.%${t}%,description.ilike.%${t}%`)
          .join(",");
        const { data } = await supabase
          .from("events")
          .select("*, cities!inner(slug, name)")
          .eq("status", "active")
          .gte("date_start", today)
          .or(orClauses)
          .limit(12);
        if (data) allEvents.push(...data);
      }

      // Tag-based search for category intent
      if (intent.categorySlugs.length > 0) {
        for (const tag of intent.categorySlugs.slice(0, 3)) {
          const { data } = await supabase
            .from("events")
            .select("*, cities!inner(slug, name)")
            .eq("status", "active")
            .gte("date_start", today)
            .contains("tags", [tag])
            .limit(10);
          if (data) allEvents.push(...data);
        }
      }

      // Deduplicate
      const seen = new Set<string>();
      const unique = allEvents.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      // Score and rank
      const scored = unique.map(item => ({
        item,
        score: scoreEvent(item, query, intent),
      }));
      return rankAndFilter(scored, 10);
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

  const hasResults = rankedListings.length > 0;
  const hasEvents = eventResults && eventResults.length > 0;
  const hasRelatedPages = relatedPages && relatedPages.length > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mb-8">
          <SearchBar large placeholder="Search venues, events, cities..." />
        </div>

        <h1 className="font-display font-bold text-2xl text-foreground mb-2">
          {query ? `Results for "${query}"` : "Search"}
        </h1>

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
          </div>
        )}

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

        {hasEvents && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-teal" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                Upcoming Events
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventResults!.map((event: any, i: number) => (
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

        <p className="text-sm text-muted-foreground mb-6">
          {isLoading ? "Searching..." : `${rankedListings.length} places found`}
        </p>

        {hasResults && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankedListings.map((listing: any, i: number) => (
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
                audienceTags={(listing as any).audience_tags}
                description={(listing as any).description}
                index={i}
              />
            ))}
          </div>
        )}

        {!isLoading && !hasResults && !hasEvents && query && (
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
                "markets Belfast",
                "events Belfast",
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
