import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ListingCard } from "@/components/ListingCard";
import { EventCard } from "@/components/EventCard";
import { getImageUrl, isPlaceholderImage, generateListingAltText, getCategoryPlaceholder } from "@/lib/image-utils";
import {
  Star, MapPin, ExternalLink, Globe, ChevronRight, ArrowLeft,
  Clock, Tag, DollarSign, Phone, Navigation, CalendarDays,
} from "lucide-react";
import { useEffect } from "react";
import NotFound from "./NotFound";

const PlaceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["place-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, cities!inner(id, name, slug), categories!inner(id, name, slug), neighbourhoods(id, name, slug)")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Related listings: same category + same city
  const { data: relatedListings } = useQuery({
    queryKey: ["related-listings", listing?.id],
    queryFn: async () => {
      if (!listing) return [];
      const { data } = await supabase
        .from("listings")
        .select("*, cities!inner(slug, name), categories!inner(slug, name)")
        .eq("category_id", listing.category_id)
        .eq("city_id", listing.city_id)
        .neq("id", listing.id)
        .eq("is_approved", true)
        .order("rating", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!listing,
  });

  // Venue events: upcoming events linked to this venue
  const { data: venueEvents } = useQuery({
    queryKey: ["venue-events", listing?.id],
    queryFn: async () => {
      if (!listing) return [];
      const today = new Date().toISOString().split("T")[0];
      // Match by venue_listing_id or by venue_name
      const { data } = await supabase
        .from("events")
        .select("*, cities!inner(name, slug), categories(name, slug)")
        .or(`venue_listing_id.eq.${listing.id},venue_name.ilike.%${listing.name.replace(/'/g, "''")}%`)
        .gte("date_start", today)
        .eq("status", "active")
        .order("date_start", { ascending: true })
        .limit(6);
      return data || [];
    },
    enabled: !!listing && !!(listing as any).is_event_venue,
  });

  const city = listing?.cities as any;
  const category = listing?.categories as any;
  const neighbourhood = listing?.neighbourhoods as any;

  // Compute image before hooks/effects
  const resolvedImage = listing
    ? getImageUrl(listing.image_url, listing.image_source, category?.slug, city?.slug, listing.image_status, listing.name)
    : "";
  const usingPlaceholder = !listing || isPlaceholderImage(resolvedImage) || listing.image_status !== "verified";
  const altText = listing
    ? (listing.image_alt && !usingPlaceholder
        ? listing.image_alt
        : generateListingAltText(listing.name, category?.name, neighbourhood?.name, city?.name, usingPlaceholder))
    : "";

  // SEO
  useEffect(() => {
    if (!listing) return;
    const cityName = city?.name || "";
    const catName = category?.name || "";
    document.title = `${listing.name} ${cityName} | ${catName} Guide | CityScoutGuide`;
    
    const metaDesc = listing.short_description
      ? `${listing.short_description} Find ${listing.name} in ${cityName} — location, details and nearby places.`
      : `Discover ${listing.name} in ${cityName}. ${catName} — location, highlights and nearby places to explore.`;
    
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", metaDesc.slice(0, 160));

    // OG tags
    const ogTags: Record<string, string> = {
      "og:title": `${listing.name} — ${catName} in ${cityName}`,
      "og:description": metaDesc.slice(0, 160),
      "og:type": "place",
      "og:url": window.location.href,
    };
    if (resolvedImage) ogTags["og:image"] = resolvedImage;
    
    Object.entries(ogTags).forEach(([prop, content]) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    });

    // JSON-LD LocalBusiness schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: listing.name,
      description: listing.short_description || listing.description || metaDesc,
      address: listing.address ? { "@type": "PostalAddress", streetAddress: listing.address } : undefined,
      image: resolvedImage,
      url: listing.website || window.location.href,
      aggregateRating: listing.rating ? {
        "@type": "AggregateRating",
        ratingValue: listing.rating,
        reviewCount: listing.review_count || 1,
      } : undefined,
      geo: listing.latitude ? {
        "@type": "GeoCoordinates",
        latitude: listing.latitude,
        longitude: listing.longitude,
      } : undefined,
    };
    let scriptEl = document.getElementById("place-schema");
    if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.id = "place-schema"; scriptEl.setAttribute("type", "application/ld+json"); document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(schema);

    return () => {
      scriptEl?.remove();
    };
  }, [listing, resolvedImage]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) return <NotFound />;

  const citySlug = city?.slug || "";
  const cityName = city?.name || "";
  const catName = category?.name || "";
  const catSlug = category?.slug || "";
  const nbName = neighbourhood?.name;
  const nbSlug = neighbourhood?.slug;

  // Generate a rich description fallback
  const fullDescription = listing.description || generateFallbackDescription(listing, catName, cityName, nbName);

  // Internal link suggestions
  const discoveryLinks = [
    { label: `Best ${catName} ${cityName}`, url: `/best-${catSlug}-${citySlug}` },
    { label: `Things to Do ${cityName}`, url: `/things-to-do-${citySlug}` },
    { label: `Date Night ${cityName}`, url: `/date-night-${citySlug}` },
    { label: `Family Day Out ${cityName}`, url: `/family-day-out-${citySlug}` },
  ];
  if (nbSlug) {
    discoveryLinks.unshift({ label: `${catName} in ${nbName}`, url: `/${catSlug}-${nbSlug}-${citySlug}` });
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <nav className="container mx-auto px-4 pt-4 pb-2">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li><Link to={`/${citySlug}`} className="hover:text-primary transition-colors">{cityName}</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li><Link to={`/best-${catSlug}-${citySlug}`} className="hover:text-primary transition-colors">{catName}</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li className="text-foreground font-medium truncate max-w-[200px]">{listing.name}</li>
        </ol>
      </nav>

      {/* Hero Image */}
      <div className="container mx-auto px-4 mb-6">
        <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-xl overflow-hidden">
          <img
            src={resolvedImage}
            alt={altText}
            className="w-full h-full object-cover"
            width={1200}
            height={400}
            onError={(e) => {
              const img = e.currentTarget;
              const fb = getCategoryPlaceholder(catSlug, listing?.name);
              if (img.src !== fb) img.src = fb;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-1 bg-teal text-teal-foreground rounded-full font-medium">
                {catName}
              </span>
              {listing.price_level && (
                <span className="text-xs px-2.5 py-1 bg-card/80 backdrop-blur-sm text-foreground rounded-full font-medium">
                  {listing.price_level}
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl md:text-4xl text-white drop-shadow-lg">
              {listing.name}
            </h1>
            {listing.short_description && (
              <p className="text-white/90 text-sm md:text-base mt-2 max-w-2xl drop-shadow">
                {listing.short_description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rating */}
            {listing.rating != null && listing.rating > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-display font-bold text-lg text-foreground">{listing.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">{listing.review_count || 0} reviews</span>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground mb-3">About {listing.name}</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                {fullDescription.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Tags */}
            {listing.audience_tags && listing.audience_tags.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-teal" /> Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {listing.audience_tags.map((tag: string) => (
                    <span key={tag} className="text-xs px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Discovery Links */}
            <div>
              <h3 className="font-display font-semibold text-sm text-foreground mb-3">Discover More</h3>
              <div className="flex flex-wrap gap-2">
                {discoveryLinks.slice(0, 5).map((link) => (
                  <Link
                    key={link.url}
                    to={link.url}
                    className="text-xs px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info Card */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 card-shadow space-y-4">
              <h3 className="font-display font-semibold text-foreground">Quick Info</h3>

              {listing.address && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{listing.address}</span>
                </div>
              )}

              {nbName && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Navigation className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <Link to={`/${catSlug}-${nbSlug}-${citySlug}`} className="text-primary hover:underline">
                    {nbName}, {cityName}
                  </Link>
                </div>
              )}

              {listing.phone && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <a href={`tel:${listing.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                    {listing.phone}
                  </a>
                </div>
              )}

              {listing.price_level && (
                <div className="flex items-start gap-2.5 text-sm">
                  <DollarSign className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Price: {listing.price_level}</span>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-2 pt-2">
                {listing.google_maps_link && (
                  <a
                    href={listing.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <MapPin className="h-4 w-4" /> View on Map
                  </a>
                )}
                {listing.website && (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Globe className="h-4 w-4" /> Visit Website
                  </a>
                )}
                <Link
                  to={`/best-${catSlug}-${citySlug}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to {catName} {cityName}
                </Link>
              </div>
            </div>

            {/* Category badge */}
            <div className="bg-card border border-border rounded-xl p-5 card-shadow">
              <h3 className="font-display font-semibold text-foreground text-sm mb-2">Category</h3>
              <Link
                to={`/best-${catSlug}-${citySlug}`}
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                {catName} <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Events at this Venue */}
        {venueEvents && venueEvents.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays className="h-5 w-5 text-accent" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                Upcoming Events at {listing.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venueEvents.map((event: any, i: number) => (
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
                  categorySlug={event.categories?.slug}
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

        {/* Related Listings */}
        {relatedListings && relatedListings.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">
              More {catName} in {cityName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedListings.slice(0, 6).map((rel: any, i: number) => (
                <ListingCard
                  key={rel.id}
                  name={rel.name}
                  slug={rel.slug}
                  citySlug={rel.cities?.slug || ""}
                  shortDescription={rel.short_description || ""}
                  rating={rel.rating}
                  reviewCount={rel.review_count || 0}
                  imageUrl={rel.image_url}
                  imageSource={rel.image_source}
                  imageAlt={rel.image_alt}
                  imageStatus={rel.image_status}
                  categorySlug={rel.categories?.slug}
                  categoryName={rel.categories?.name}
                  cityName={rel.cities?.name}
                  address={rel.address}
                  priceLevel={rel.price_level}
                  googleMapsLink={rel.google_maps_link}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

/** Generate a useful description from available fields when none exists */
function generateFallbackDescription(
  listing: any,
  catName: string,
  cityName: string,
  nbName?: string
): string {
  const parts: string[] = [];
  
  parts.push(`${listing.name} is a popular ${catName.toLowerCase()} in ${cityName}${nbName ? `, located in the ${nbName} area` : ""}.`);

  if (listing.short_description) {
    parts.push(listing.short_description);
  }

  if (listing.address) {
    parts.push(`You can find ${listing.name} at ${listing.address}.`);
  }

  if (listing.rating) {
    parts.push(`With a rating of ${listing.rating} from ${listing.review_count || 0} reviews, it's one of the well-regarded ${catName.toLowerCase()} spots in the area.`);
  }

  if (listing.price_level) {
    const priceLevels: Record<string, string> = {
      "£": "budget-friendly",
      "££": "moderately priced",
      "£££": "upscale",
      "££££": "fine dining",
    };
    const priceDesc = priceLevels[listing.price_level] || listing.price_level;
    parts.push(`It's considered ${priceDesc}.`);
  }

  return parts.join("\n\n");
}

export default PlaceDetailPage;
