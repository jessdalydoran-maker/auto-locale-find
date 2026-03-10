import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, generateEventAltText, isPlaceholderImage, getEventImageByKeywords } from "@/lib/image-utils";

interface EventCardProps {
  title: string;
  slug: string;
  shortDescription: string | null;
  dateStart: string;
  dateEnd: string | null;
  timeStart: string | null;
  venueName: string | null;
  venueAddress: string | null;
  imageUrl: string | null;
  imageSource?: string | null;
  imageAlt?: string | null;
  imageStatus?: string | null;
  categorySlug?: string | null;
  cityName?: string | null;
  isFree: boolean;
  isFamilyFriendly: boolean;
  ticketUrl: string | null;
  price: string | null;
  tags: string[];
  index?: number;
}

export const EventCard = ({
  title,
  slug,
  shortDescription,
  dateStart,
  dateEnd,
  timeStart,
  venueName,
  imageUrl,
  imageSource,
  imageAlt,
  imageStatus,
  categorySlug,
  cityName,
  isFree,
  isFamilyFriendly,
  ticketUrl,
  price,
  tags,
  index = 0,
}: EventCardProps) => {
  const keywordImage = getEventImageByKeywords(title, tags);
  const resolvedImage = keywordImage && (!imageUrl || imageStatus !== "verified")
    ? keywordImage
    : getImageUrl(imageUrl, imageSource, categorySlug || "events", null, imageStatus);
  const usingPlaceholder = isPlaceholderImage(resolvedImage) || (imageStatus !== "verified" && !keywordImage);
  const altText = imageAlt && !usingPlaceholder
    ? imageAlt
    : generateEventAltText(title, venueName, cityName, usingPlaceholder);

  const detailUrl = `/event/${slug}`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "pm" : "am";
    const h12 = hour % 12 || 12;
    return `${h12}:${m}${ampm}`;
  };

  return (
    <div
      className="group bg-card rounded-lg border border-border overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link to={detailUrl} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={resolvedImage}
            alt={altText}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={600}
            height={375}
          />
          {/* Date badge */}
          <div className="absolute top-2.5 left-2.5 bg-card/95 backdrop-blur-sm rounded-md px-2.5 py-1.5 text-center">
            <span className="block text-xs font-bold text-accent leading-tight">
              {new Date(dateStart + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric" })}
            </span>
            <span className="block text-[10px] font-medium text-muted-foreground uppercase">
              {new Date(dateStart + "T00:00:00").toLocaleDateString("en-GB", { month: "short" })}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 flex gap-1">
            {isFree && (
              <Badge className="bg-emerald-600 text-emerald-50 text-[10px] border-0">Free</Badge>
            )}
            {isFamilyFriendly && (
              <Badge variant="secondary" className="text-[10px]">Family</Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="p-3.5">
        <Link to={detailUrl}>
          <h3 className="font-display font-semibold text-sm text-foreground mb-1.5 line-clamp-2 group-hover:text-accent transition-colors">
            {title}
          </h3>
        </Link>

        {shortDescription && (
          <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2 leading-relaxed">{shortDescription}</p>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0 text-accent" />
            <span>
              {formatDate(dateStart)}
              {dateEnd && dateEnd !== dateStart && ` – ${formatDate(dateEnd)}`}
            </span>
          </div>
          {timeStart && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0 text-accent" />
              <span>{formatTime(timeStart)}</span>
            </div>
          )}
          {venueName && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0 text-accent" />
              <span className="line-clamp-1">{venueName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
          {price && !isFree ? (
            <span className="text-xs font-medium text-foreground">{price}</span>
          ) : isFree ? (
            <span className="text-xs font-medium text-emerald-600">Free Entry</span>
          ) : (
            <span />
          )}
          {ticketUrl && (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent font-medium hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Ticket className="h-3 w-3" />
              Get Tickets
            </a>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
