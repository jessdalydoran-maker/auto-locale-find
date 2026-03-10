import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { MapPin, ChevronRight } from "lucide-react";
import {
  parseSlug,
  generateTitle,
  generateMetaDescription,
  generateIntroText,
  buildPageUrl,
} from "@/lib/seo-utils";
import { useEffect, useMemo } from "react";

const ProgrammaticPage = () => {
  const { "*": rawSlug } = useParams();
  const slug = rawSlug || "";

  // Fetch lookup data for slug parsing
  const { data: cities } = useQuery({
    queryKey: ["all-cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("id, name, slug");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: neighbourhoods } = useQuery({
    queryKey: ["all-neighbourhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighbourhoods")
        .select("id, name, slug, description, city_id, cities!inner(slug)")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: allCategories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: modifiers } = useQuery({
    queryKey: ["all-modifiers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modifiers").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Parse the slug once lookup data is available
  const parsed = useMemo(() => {
    if (!cities || !neighbourhoods) return null;
    const citySlugs = cities.map((c) => c.slug);
    const nbSlugs = neighbourhoods.map((n) => ({
      slug: n.slug,
      citySlug: (n.cities as any)?.slug || "",
    }));
    return parseSlug(slug, citySlugs, nbSlugs);
  }, [slug, cities, neighbourhoods]);

  // Resolve entities
  const city = useMemo(() => cities?.find((c) => c.slug === parsed?.citySlug), [cities, parsed]);
  const category = useMemo(() => allCategories?.find((c) => c.slug === parsed?.categorySlug), [allCategories, parsed]);
  const modifier = useMemo(() => modifiers?.find((m) => m.slug === parsed?.modifierSlug), [modifiers, parsed]);
  const neighbourhood = useMemo(
    () => neighbourhoods?.find((n) => n.slug === parsed?.neighbourhoodSlug && (n.cities as any)?.slug === parsed?.citySlug),
    [neighbourhoods, parsed]
  );

  const locationName = neighbourhood?.name || city?.name || "";
  const cityName = neighbourhood ? city?.name : undefined;

  // Fetch listings
  const { data: listings } = useQuery({
    queryKey: ["prog-listings", parsed?.categorySlug, parsed?.citySlug, parsed?.neighbourhoodSlug],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("cities.slug", parsed!.citySlug)
        .eq("categories.slug", parsed!.categorySlug)
        .eq("is_approved", true)
        .order("rating", { ascending: false })
        .limit(10);

      if (parsed?.neighbourhoodSlug && neighbourhood) {
        query = query.eq("neighbourhood_id", neighbourhood.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!parsed?.citySlug && !!parsed?.categorySlug,
  });

  // Dynamic document title & meta
  const title = category && city
    ? generateTitle(modifier?.name?.toLowerCase() || null, category.name, locationName, cityName)
    : "Loading...";

  const metaDesc = category && city
    ? generateMetaDescription(modifier?.name?.toLowerCase() || null, category.name, locationName, cityName)
    : "";

  const introText = category && city && listings
    ? generateIntroText(modifier?.name?.toLowerCase() || null, category.name, locationName, listings.length, cityName)
    : "";

  useEffect(() => {
    if (title !== "Loading...") {
      document.title = title;
      const metaEl = document.querySelector('meta[name="description"]');
      if (metaEl) metaEl.setAttribute("content", metaDesc);
    }
  }, [title, metaDesc]);

  // Build JSON-LD
  const jsonLd = useMemo(() => {
    if (!listings?.length || !category || !city) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      description: metaDesc,
      numberOfItems: listings.length,
      itemListElement: listings.map((l, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: l.name,
          description: l.short_description,
          address: l.address,
          aggregateRating: l.rating
            ? { "@type": "AggregateRating", ratingValue: l.rating, reviewCount: l.review_count }
            : undefined,
          image: l.image_url,
          url: l.website,
        },
      })),
    };
  }, [listings, category, city, title, metaDesc]);

  // Related pages for internal linking
  const relatedPages = useMemo(() => {
    if (!allCategories || !modifiers || !parsed || !city) return [];
    const links: { url: string; label: string }[] = [];

    // Other categories in same city with same modifier
    allCategories
      .filter((c) => c.slug !== parsed.categorySlug)
      .slice(0, 6)
      .forEach((cat) => {
        links.push({
          url: buildPageUrl(parsed.modifierSlug, cat.slug, parsed.neighbourhoodSlug, parsed.citySlug),
          label: `${modifier?.name || ""} ${cat.name} ${neighbourhood?.name || city?.name || ""}`.trim(),
        });
      });

    // Same category with different modifiers
    modifiers
      .filter((m) => m.slug !== parsed.modifierSlug)
      .slice(0, 4)
      .forEach((mod) => {
        links.push({
          url: buildPageUrl(mod.slug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug),
          label: `${mod.name} ${category?.name || ""} ${neighbourhood?.name || city?.name || ""}`.trim(),
        });
      });

    // Neighbourhood variations (if in city-level, link to neighbourhoods)
    if (!parsed.neighbourhoodSlug && neighbourhoods) {
      neighbourhoods
        .filter((n) => (n.cities as any)?.slug === parsed.citySlug)
        .slice(0, 6)
        .forEach((nb) => {
          links.push({
            url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, nb.slug, parsed.citySlug),
            label: `${modifier?.name || "Best"} ${category?.name || ""} ${nb.name}`.trim(),
          });
        });
    }

    return links;
  }, [allCategories, modifiers, parsed, city, category, modifier, neighbourhood, neighbourhoods]);

  // Breadcrumb
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: "Home", url: "/" }];
    if (city) crumbs.push({ label: city.name, url: `/${city.slug}` });
    if (neighbourhood) crumbs.push({ label: neighbourhood.name, url: `/${parsed?.categorySlug}-${neighbourhood.slug}-${city?.slug}` });
    if (category) crumbs.push({ label: modifier ? `${modifier.name} ${category.name}` : category.name, url: "" });
    return crumbs;
  }, [city, neighbourhood, category, modifier, parsed]);

  return (
    <Layout>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Hero */}
      <section className="hero-gradient py-10 md:py-14">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-xs text-primary-foreground/60 mb-3 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.url ? (
                  <Link to={crumb.url} className="hover:text-primary-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-primary-foreground/90">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          {city && (
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-2">
              <MapPin className="h-4 w-4" />
              <Link to={`/${city.slug}`} className="hover:text-primary-foreground transition-colors">
                {neighbourhood ? `${neighbourhood.name}, ${city.name}` : city.name}
              </Link>
            </div>
          )}
          <h1 className="font-display font-bold text-2xl md:text-4xl text-primary-foreground">{title}</h1>
          {metaDesc && (
            <p className="text-primary-foreground/60 text-sm mt-2 max-w-2xl">{metaDesc}</p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AdPlaceholder slot="header" />

        {/* Intro text (unique per page) */}
        {introText && (
          <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl my-6">{introText}</p>
        )}

        {/* Top listings */}
        <div className="my-8">
          <h2 className="font-display font-semibold text-xl text-foreground mb-6">
            Top {listings?.length || 0} {modifier?.name || ""} {category?.name || "Places"} in {locationName}
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
                  citySlug={parsed?.citySlug || ""}
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

        {/* Internal links - related searches */}
        {relatedPages.length > 0 && (
          <section className="py-12 border-t border-border mt-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Related Searches</h2>
            <div className="flex flex-wrap gap-2">
              {relatedPages.map((link, i) => (
                <Link
                  key={i}
                  to={link.url}
                  className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Neighbourhood links for Belfast */}
        {!parsed?.neighbourhoodSlug && neighbourhoods && city && (
          <section className="py-8 border-t border-border">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Explore {city.name} Neighbourhoods
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {neighbourhoods
                .filter((n) => (n.cities as any)?.slug === city.slug)
                .map((nb) => (
                  <Link
                    key={nb.id}
                    to={buildPageUrl(parsed?.modifierSlug || "best", parsed?.categorySlug || "restaurants", nb.slug, city.slug)}
                    className="p-4 bg-muted rounded-lg hover:bg-accent/10 transition-colors group"
                  >
                    <span className="font-medium text-sm text-foreground group-hover:text-accent transition-colors">{nb.name}</span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{nb.description}</p>
                  </Link>
                ))}
            </div>
          </section>
        )}

        <AdPlaceholder slot="footer" />
      </div>
    </Layout>
  );
};

export default ProgrammaticPage;
