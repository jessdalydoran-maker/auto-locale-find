import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, generateEventAltText, isPlaceholderImage, getEventImageByKeywords, buildImageErrorHandler } from "@/lib/image-utils";
import { useMemo } from "react";

interface EventCardProps {
  title: string; slug: string; shortDescription: string | null;
  dateStart: string; dateEnd: string | null; timeStart: string | null;
  venueName: string | null; venueAddress: string | null;
  imageUrl: string | null; imageSource?: string | null; imageAlt?: string | null; imageStatus?: string | null;
  categorySlug?: string | null; cityName?: string | null;
  isFree: boolean; isFamilyFriendly: boolean;
  ticketUrl: string | null; price: string | null; tags: string[]; index?: number;
}

export const EventCard = ({
  title, slug, shortDescription, dateStart, dateEnd, timeStart,
  venueName, imageUrl, imageSource, imageAlt, imageStatus, categorySlug, cityName,
  isFree, isFamilyFriendly, ticketUrl, price, tags, index = 0,
}: EventCardProps) => {
  const keywordImage = getEventImageByKeywords(title, tags);
  const resolvedImage = keywordImage && (!imageUrl || imageStatus !== "verified")
    ? keywordImage : getImageUrl(imageUrl, imageSource, categorySlug || "events", null, imageStatus, title, tags, shortDescription);
  const usingPlaceholder = isPlaceholderImage(resolvedImage) || (imageStatus !== "verified" && !keywordImage);
  const altText = imageAlt && !usingPlaceholder ? imageAlt : generateEventAltText(title, venueName, cityName, usingPlaceholder);
  const handleImageError = useMemo(() => buildImageErrorHandler(categorySlug || "events", title, tags), [categorySlug, title, tags]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };
  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m}${hour >= 12 ? "pm" : "am"}`;
  };

  return (
    <div
      className="group bg-card rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:scale-[1.01] animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link to={`/event/${slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={resolvedImage} alt={altText}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            loading="lazy" decoding="async" width={600} height={375} onError={handleImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center">
            <span className="block text-xs font-bold text-accent leading-tight">
              {new Date(dateStart + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric" })}
            </span>
            <span className="block text-[10px] font-medium text-muted-foreground uppercase">
              {new Date(dateStart + "T00:00:00").toLocaleDateString("en-GB", { month: "short" })}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex gap-1.5">
            {isFree && <Badge className="bg-emerald-600 text-emerald-50 text-[10px] border-0 rounded-lg">Free</Badge>}
            {isFamilyFriendly && <Badge variant="secondary" className="text-[10px] rounded-lg">Family</Badge>}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/event/${slug}`}>
          <h3 className="font-display font-semibold text-base text-foreground mb-1.5 line-clamp-2 group-hover:text-accent transition-colors">
            {title}
          </h3>
        </Link>
        {shortDescription && <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{shortDescription}</p>}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span>{formatDate(dateStart)}{dateEnd && dateEnd !== dateStart && ` – ${formatDate(dateEnd)}`}</span>
          </div>
          {timeStart && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span>{formatTime(timeStart)}</span>
            </div>
          )}
          {venueName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="line-clamp-1">{venueName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          {price && !isFree ? (
            <span className="text-xs font-semibold text-foreground">{price}</span>
          ) : isFree ? (
            <span className="text-xs font-semibold text-emerald-600">Free Entry</span>
          ) : <span />}
          {ticketUrl && (
            <a href={ticketUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}>
              <Ticket className="h-3 w-3" /> Get Tickets
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
