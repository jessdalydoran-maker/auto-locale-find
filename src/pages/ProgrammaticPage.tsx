import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { MapPin, ChevronRight, Calendar, Filter } from "lucide-react";
import {
  parseSlug,
  generateTitle,
  generateMetaDescription,
  generateIntroText,
  buildPageUrl,
  formatTimeIntent,
  getTimeIntentDateRange,
  isEventCategory,
} from "@/lib/seo-utils";
import { useEffect, useMemo, useState } from "react";

const ProgrammaticPage = () => {
  const { "*": rawSlug } = useParams();
  const slug = rawSlug || "";
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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

  // Parse the slug
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
  const showEvents = parsed ? isEventCategory(parsed.categorySlug) : false;
  const dateRange = parsed ? getTimeIntentDateRange(parsed.timeIntent || null) : null;

  // Fetch listings (for non-event categories or mixed)
  const { data: listings } = useQuery({
    queryKey: ["prog-listings", parsed?.categorySlug, parsed?.citySlug, parsed?.neighbourhoodSlug, parsed?.modifierSlug],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("cities.slug", parsed!.citySlug)
        .eq("is_approved", true)
        .order("rating", { ascending: false })
        .limit(20);

      // For generic categories like "things-to-do", don't filter by category
      if (parsed!.categorySlug !== "things-to-do" && !showEvents) {
        query = query.eq("categories.slug", parsed!.categorySlug);
      }

      if (parsed?.neighbourhoodSlug && neighbourhood) {
        query = query.eq("neighbourhood_id", neighbourhood.id);
      }

      // Modifier-based filtering
      if (parsed?.modifierSlug === "free") {
        query = query.eq("price_level", "Free");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!parsed?.citySlug && !!parsed?.categorySlug && !showEvents,
  });

  // Fetch events (for event-related categories)
  const { data: events } = useQuery({
    queryKey: ["prog-events", parsed?.categorySlug, parsed?.citySlug, parsed?.neighbourhoodSlug, parsed?.timeIntent, parsed?.modifierSlug],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, cities!inner(slug, name)")
        .eq("cities.slug", parsed!.citySlug)
        .eq("status", "active")
        .order("date_start", { ascending: true })
        .limit(20);

      if (parsed?.neighbourhoodSlug && neighbourhood) {
        query = query.eq("neighbourhood_id", neighbourhood.id);
      }

      if (dateRange) {
        query = query.gte("date_start", dateRange.start).lte("date_start", dateRange.end);
      }

      if (parsed?.modifierSlug === "free") {
        query = query.eq("is_free", true);
      }
      if (parsed?.modifierSlug === "family") {
        query = query.eq("is_family_friendly", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!parsed?.citySlug && showEvents,
  });

  const itemCount = showEvents ? (events?.length || 0) : (listings?.length || 0);

  // Dynamic document title & meta
  const title = category && city
    ? generateTitle(modifier?.name?.toLowerCase() || null, category.name, locationName, cityName, parsed?.timeIntent)
    : "Loading...";

  const metaDesc = category && city
    ? generateMetaDescription(modifier?.name?.toLowerCase() || null, category.name, locationName, cityName, parsed?.timeIntent)
    : "";

  const introText = category && city
    ? generateIntroText(modifier?.name?.toLowerCase() || null, category.name, locationName, itemCount, cityName, parsed?.timeIntent)
    : "";

  useEffect(() => {
    if (title !== "Loading...") {
      document.title = title;
      const metaEl = document.querySelector('meta[name="description"]');
      if (metaEl) metaEl.setAttribute("content", metaDesc);
    }
  }, [title, metaDesc]);

  // JSON-LD
  const jsonLd = useMemo(() => {
    if (!category || !city) return null;

    if (showEvents && events?.length) {
      return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: title,
        description: metaDesc,
        numberOfItems: events.length,
        itemListElement: events.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Event",
            name: e.title,
            description: e.short_description,
            startDate: e.date_start,
            endDate: e.date_end || e.date_start,
            location: e.venue_name ? {
              "@type": "Place",
              name: e.venue_name,
              address: e.venue_address,
            } : undefined,
            isAccessibleForFree: e.is_free,
            image: e.image_url,
          },
        })),
      };
    }

    if (listings?.length) {
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
    }

    return null;
  }, [listings, events, category, city, title, metaDesc, showEvents]);

  // FAQ schema
  const faqItems = useMemo(() => {
    if (!category || !city) return [];
    const loc = neighbourhood ? `${neighbourhood.name}, ${city.name}` : city.name;
    const catLower = category.name.toLowerCase();
    const modLabel = modifier?.name?.toLowerCase() || "";

    return [
      {
        q: `What are the best ${modLabel} ${catLower} in ${loc}?`,
        a: `We've curated the top ${modLabel} ${catLower} in ${loc} based on reviews, ratings and local recommendations. Browse our full list above.`,
      },
      {
        q: `How many ${catLower} are there in ${loc}?`,
        a: `We currently feature ${itemCount} ${modLabel} ${catLower} in ${loc}. We're always adding new places.`,
      },
      {
        q: `Are there free ${catLower} in ${loc}?`,
        a: `Yes! Check our free ${catLower} page for ${loc} to find options that won't cost a penny.`,
      },
    ];
  }, [category, city, modifier, neighbourhood, itemCount]);

  // Related pages
  const relatedPages = useMemo(() => {
    if (!allCategories || !modifiers || !parsed || !city) return [];
    const links: { url: string; label: string }[] = [];

    // Time intent variations
    if (!parsed.timeIntent) {
      ["this-weekend", "today", "this-week"].forEach((ti) => {
        links.push({
          url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, ti),
          label: `${modifier?.name || ""} ${category?.name || ""} ${locationName} ${formatTimeIntent(ti)}`.trim(),
        });
      });
    }

    // Other categories
    allCategories
      .filter((c) => c.slug !== parsed.categorySlug)
      .slice(0, 5)
      .forEach((cat) => {
        links.push({
          url: buildPageUrl(parsed.modifierSlug, cat.slug, parsed.neighbourhoodSlug, parsed.citySlug, parsed.timeIntent),
          label: `${modifier?.name || ""} ${cat.name} ${neighbourhood?.name || city?.name || ""}`.trim(),
        });
      });

    // Different modifiers
    modifiers
      .filter((m) => m.slug !== parsed.modifierSlug)
      .slice(0, 4)
      .forEach((mod) => {
        links.push({
          url: buildPageUrl(mod.slug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, parsed.timeIntent),
          label: `${mod.name} ${category?.name || ""} ${neighbourhood?.name || city?.name || ""}`.trim(),
        });
      });

    // Neighbourhood variations
    if (!parsed.neighbourhoodSlug && neighbourhoods) {
      neighbourhoods
        .filter((n) => (n.cities as any)?.slug === parsed.citySlug)
        .slice(0, 6)
        .forEach((nb) => {
          links.push({
            url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, nb.slug, parsed.citySlug, parsed.timeIntent),
            label: `${modifier?.name || "Best"} ${category?.name || ""} ${nb.name}`.trim(),
          });
        });
    }

    return links;
  }, [allCategories, modifiers, parsed, city, category, modifier, neighbourhood, neighbourhoods, locationName]);

  // Breadcrumb
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: "Home", url: "/" }];
    if (city) crumbs.push({ label: city.name, url: `/${city.slug}` });
    if (neighbourhood) crumbs.push({ label: neighbourhood.name, url: `/${parsed?.categorySlug}-${neighbourhood.slug}-${city?.slug}` });
    if (category) {
      const label = [modifier?.name, category.name, parsed?.timeIntent ? formatTimeIntent(parsed.timeIntent) : ""].filter(Boolean).join(" ");
      crumbs.push({ label, url: "" });
    }
    return crumbs;
  }, [city, neighbourhood, category, modifier, parsed]);

  // Filter options for the page
  const filterOptions = useMemo(() => {
    if (!parsed || !city) return [];
    const filters: { label: string; value: string; url: string }[] = [];

    if (!parsed.timeIntent) {
      filters.push(
        { label: "Today", value: "today", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, "today") },
        { label: "This Weekend", value: "this-weekend", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, "this-weekend") },
        { label: "This Week", value: "this-week", url: buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, "this-week") },
      );
    }

    if (!parsed.modifierSlug || parsed.modifierSlug !== "free") {
      filters.push({ label: "Free", value: "free", url: buildPageUrl("free", parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, parsed.timeIntent) });
    }
    if (!parsed.modifierSlug || parsed.modifierSlug !== "family") {
      filters.push({ label: "Family", value: "family", url: buildPageUrl("family", parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug, parsed.timeIntent) });
    }

    return filters;
  }, [parsed, city]);

  return (
    <Layout>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* FAQ Schema */}
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      )}

      {/* Breadcrumb Schema */}
      {breadcrumbs.length > 1 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: breadcrumbs.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.label,
                ...(c.url ? { item: `https://bestlocal.co.uk${c.url}` } : {}),
              })),
            }),
          }}
        />
      )}

      {/* Hero */}
      <section className="bg-card border-b border-border py-8 md:py-12">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.url ? (
                  <Link to={crumb.url} className="hover:text-accent transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          {city && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <MapPin className="h-4 w-4" />
              <Link to={`/${city.slug}`} className="hover:text-accent transition-colors">
                {neighbourhood ? `${neighbourhood.name}, ${city.name}` : city.name}
              </Link>
              {parsed?.timeIntent && (
                <>
                  <span className="text-border">•</span>
                  <Calendar className="h-4 w-4" />
                  <span>{formatTimeIntent(parsed.timeIntent)}</span>
                </>
              )}
            </div>
          )}
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">{title}</h1>
          {metaDesc && (
            <p className="text-muted-foreground text-sm mt-2 max-w-2xl">{metaDesc}</p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AdPlaceholder slot="header" />

        {/* Filters */}
        {filterOptions.length > 0 && (
          <div className="flex items-center gap-2 my-6 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filterOptions.map((f) => (
              <Link
                key={f.value}
                to={f.url}
                className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {f.label}
              </Link>
            ))}
            {parsed?.timeIntent && (
              <Link
                to={buildPageUrl(parsed.modifierSlug, parsed.categorySlug, parsed.neighbourhoodSlug, parsed.citySlug)}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-full"
              >
                {formatTimeIntent(parsed.timeIntent)} ✕
              </Link>
            )}
          </div>
        )}

        {/* Intro text */}
        {introText && (
          <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl my-6">{introText}</p>
        )}

        {/* Events Grid */}
        {showEvents && (
          <div className="my-8">
            <h2 className="font-display font-semibold text-xl text-foreground mb-6">
              {modifier?.name || ""} {category?.name || "Events"} in {locationName}
              {parsed?.timeIntent ? ` ${formatTimeIntent(parsed.timeIntent)}` : ""}
            </h2>
            {events && events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, i) => (
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
                    isFree={event.is_free}
                    isFamilyFriendly={event.is_family_friendly}
                    ticketUrl={event.ticket_url}
                    price={event.price}
                    tags={event.tags || []}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/50 rounded-lg">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No events found for this search yet.</p>
                <p className="text-muted-foreground text-xs mt-1">We're adding new events all the time — check back soon!</p>
              </div>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {!showEvents && (
          <div className="my-8">
            <h2 className="font-display font-semibold text-xl text-foreground mb-6">
              Top {itemCount > 0 ? itemCount : ""} {modifier?.name || ""} {category?.name || "Places"} in {locationName}
            </h2>
            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing, i) => (
                  <div key={listing.id} className="relative">
                    <span className="absolute -top-2 -left-2 z-10 w-7 h-7 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold card-shadow">
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
            ) : (
              <div className="text-center py-16 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground text-sm">No listings found for this search yet.</p>
                <p className="text-muted-foreground text-xs mt-1">We're adding new places all the time!</p>
              </div>
            )}
          </div>
        )}

        <AdPlaceholder slot="mid-content" />

        {/* FAQ Section */}
        {faqItems.length > 0 && (
          <section className="py-8 border-t border-border mt-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4 max-w-3xl">
              {faqItems.map((faq, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-display font-medium text-sm text-foreground mb-2">{faq.q}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Internal links */}
        {relatedPages.length > 0 && (
          <section className="py-8 border-t border-border">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Related Searches</h2>
            <div className="flex flex-wrap gap-2">
              {relatedPages.map((link, i) => (
                <Link
                  key={i}
                  to={link.url}
                  className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-accent hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Neighbourhood links */}
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
                    to={buildPageUrl(parsed?.modifierSlug || null, parsed?.categorySlug || "things-to-do", nb.slug, city.slug, parsed?.timeIntent)}
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
