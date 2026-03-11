import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { EventCard } from "@/components/EventCard";
import { getImageUrl, getEventImageByKeywords, isPlaceholderImage, generateEventAltText, getCategoryPlaceholder } from "@/lib/image-utils";
import {
  Calendar, Clock, MapPin, Ticket, ExternalLink, ChevronRight,
  ArrowLeft, Users, Tag, Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import NotFound from "./NotFound";

const EventDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, cities!inner(id, name, slug), categories(id, name, slug), neighbourhoods(id, name, slug)")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Related events: same city, upcoming
  const { data: relatedEvents } = useQuery({
    queryKey: ["related-events", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("*, cities!inner(slug, name)")
        .eq("city_id", event.city_id)
        .eq("status", "active")
        .neq("id", event.id)
        .gte("date_start", today)
        .order("date_start", { ascending: true })
        .limit(6);
      return data || [];
    },
    enabled: !!event,
  });

  const city = event?.cities as any;
  const category = event?.categories as any;
  const neighbourhood = event?.neighbourhoods as any;

  // Image resolution
  const keywordImage = event ? getEventImageByKeywords(event.title, event.tags) : null;
  const resolvedImage = event
    ? (keywordImage && (!event.image_url || event.image_status !== "verified")
        ? keywordImage
        : getImageUrl(event.image_url, event.image_source, category?.slug || "events", null, event.image_status, event.title, event.tags, event.short_description))
    : "";
  const usingPlaceholder = !event || isPlaceholderImage(resolvedImage) || (event.image_status !== "verified" && !keywordImage);
  const altText = event
    ? (event.image_alt && !usingPlaceholder
        ? event.image_alt
        : generateEventAltText(event.title, event.venue_name, city?.name, usingPlaceholder))
    : "";

  // SEO
  useEffect(() => {
    if (!event) return;
    const cityName = city?.name || "";
    document.title = `${event.title} | ${cityName} Events | CityScoutGuide`;

    const metaDesc = event.short_description
      ? `${event.short_description} Find details, dates and tickets for ${event.title} in ${cityName}.`
      : `${event.title} in ${cityName} — dates, venue, tickets and more.`;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", metaDesc.slice(0, 160));

    // OG tags
    const ogTags: Record<string, string> = {
      "og:title": event.title,
      "og:description": metaDesc.slice(0, 160),
      "og:type": "event",
      "og:url": window.location.href,
    };
    if (resolvedImage) ogTags["og:image"] = resolvedImage;
    Object.entries(ogTags).forEach(([prop, content]) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    });

    // JSON-LD Event schema
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description || event.short_description || metaDesc,
      startDate: event.date_start + (event.time_start ? `T${event.time_start}` : ""),
      endDate: event.date_end ? event.date_end + (event.time_end ? `T${event.time_end}` : "") : undefined,
      image: resolvedImage,
      url: window.location.href,
      isAccessibleForFree: event.is_free,
      location: event.venue_name ? {
        "@type": "Place",
        name: event.venue_name,
        address: event.venue_address || cityName,
      } : undefined,
      offers: event.ticket_url ? {
        "@type": "Offer",
        url: event.ticket_url,
        price: event.price || "0",
        priceCurrency: "GBP",
        availability: "https://schema.org/InStock",
      } : undefined,
    };

    let scriptEl = document.getElementById("event-schema");
    if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.id = "event-schema"; scriptEl.setAttribute("type", "application/ld+json"); document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(schema);

    return () => { scriptEl?.remove(); };
  }, [event]);

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

  if (!event) return <NotFound />;

  const cityName = city?.name || "";
  const citySlug = city?.slug || "";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "pm" : "am";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const fullDescription = event.description || event.short_description || `${event.title} is an event taking place in ${cityName}${event.venue_name ? ` at ${event.venue_name}` : ""}. ${event.is_free ? "This is a free event." : event.price ? `Tickets are ${event.price}.` : ""}`;

  const discoveryLinks = [
    { label: `Events ${cityName}`, url: `/events-${citySlug}` },
    { label: `Things to Do ${cityName}`, url: `/things-to-do-${citySlug}` },
    { label: `This Weekend ${cityName}`, url: `/things-to-do-${citySlug}-this-weekend` },
    ...(event.is_free ? [{ label: `Free Events ${cityName}`, url: `/free-events-${citySlug}` }] : []),
    ...(event.is_family_friendly ? [{ label: `Family Events ${cityName}`, url: `/family-activities-${citySlug}` }] : []),
  ];

  return (
    <Layout>
      {/* Breadcrumb */}
      <nav className="container mx-auto px-4 pt-4 pb-2">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li><Link to={`/${citySlug}`} className="hover:text-primary transition-colors">{cityName}</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li><Link to={`/events-${citySlug}`} className="hover:text-primary transition-colors">Events</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li className="text-foreground font-medium truncate max-w-[200px]">{event.title}</li>
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
              const fb = getCategoryPlaceholder(category?.slug || "events", event?.title, event?.tags);
              if (img.src !== fb) img.src = fb;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-2">
              {event.is_free && (
                <Badge className="bg-emerald-600 text-emerald-50 border-0">Free</Badge>
              )}
              {event.is_family_friendly && (
                <Badge variant="secondary">Family Friendly</Badge>
              )}
              {category && (
                <Badge variant="outline" className="bg-card/80 backdrop-blur-sm border-0">{category.name}</Badge>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl md:text-4xl text-white drop-shadow-lg">
              {event.title}
            </h1>
            {event.short_description && (
              <p className="text-white/90 text-sm md:text-base mt-2 max-w-2xl drop-shadow">
                {event.short_description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground mb-3">About This Event</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                {fullDescription.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-teal" /> Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {event.tags.map((tag: string) => (
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
                {discoveryLinks.map((link) => (
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

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 card-shadow space-y-4">
              <h3 className="font-display font-semibold text-foreground">Event Details</h3>

              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                <div>
                  <span className="text-foreground font-medium">{formatDate(event.date_start)}</span>
                  {event.date_end && event.date_end !== event.date_start && (
                    <span className="text-muted-foreground"> — {formatDate(event.date_end)}</span>
                  )}
                </div>
              </div>

              {event.time_start && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    {formatTime(event.time_start)}
                    {event.time_end && ` — ${formatTime(event.time_end)}`}
                  </span>
                </div>
              )}

              {event.venue_name && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-foreground font-medium">{event.venue_name}</span>
                    {event.venue_address && (
                      <p className="text-muted-foreground text-xs mt-0.5">{event.venue_address}</p>
                    )}
                  </div>
                </div>
              )}

              {event.price && !event.is_free && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Ticket className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{event.price}</span>
                </div>
              )}

              {event.is_free && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Ticket className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-emerald-600 font-medium">Free Entry</span>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-2 pt-2">
                {event.ticket_url && (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                  >
                    <Ticket className="h-4 w-4" /> Get Tickets
                  </a>
                )}
                {event.official_url && (
                  <a
                    href={event.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Globe className="h-4 w-4" /> Official Website
                  </a>
                )}
                <Link
                  to={`/events-${citySlug}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> All Events in {cityName}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents && relatedEvents.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">
              More Events in {cityName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedEvents.slice(0, 6).map((rel: any, i: number) => (
                <EventCard
                  key={rel.id}
                  title={rel.title}
                  slug={rel.slug}
                  shortDescription={rel.short_description}
                  dateStart={rel.date_start}
                  dateEnd={rel.date_end}
                  timeStart={rel.time_start}
                  venueName={rel.venue_name}
                  venueAddress={rel.venue_address}
                  imageUrl={rel.image_url}
                  imageSource={rel.image_source}
                  imageAlt={rel.image_alt}
                  imageStatus={rel.image_status}
                  cityName={rel.cities?.name}
                  isFree={rel.is_free}
                  isFamilyFriendly={rel.is_family_friendly}
                  ticketUrl={rel.ticket_url}
                  price={rel.price}
                  tags={rel.tags || []}
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

export default EventDetailPage;
