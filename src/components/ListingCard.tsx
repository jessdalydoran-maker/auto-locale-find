import { Link } from "react-router-dom";
import { Star, MapPin, ExternalLink } from "lucide-react";

interface ListingCardProps {
  name: string;
  slug: string;
  citySlug: string;
  shortDescription: string;
  rating: number | null;
  reviewCount: number;
  imageUrl: string | null;
  address: string | null;
  priceLevel: string | null;
  googleMapsLink: string | null;
  isFeatured?: boolean;
  index?: number;
}

export const ListingCard = ({
  name,
  slug,
  citySlug,
  shortDescription,
  rating,
  reviewCount,
  imageUrl,
  address,
  priceLevel,
  googleMapsLink,
  isFeatured,
  index = 0,
}: ListingCardProps) => {
  return (
    <div
      className="group bg-card rounded-lg border border-border overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
        />
        {isFeatured && (
          <span className="absolute top-2.5 left-2.5 bg-accent text-accent-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
            Featured
          </span>
        )}
        {priceLevel && (
          <span className="absolute top-2.5 right-2.5 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-0.5 rounded">
            {priceLevel}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link
            to={`/${citySlug}/${slug}`}
            className="font-display font-semibold text-sm text-foreground hover:text-accent transition-colors line-clamp-1"
          >
            {name}
          </Link>
          {rating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-foreground">{rating}</span>
              <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2 leading-relaxed">{shortDescription}</p>

        <div className="flex items-center justify-between">
          {address && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}
          {googleMapsLink && (
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent hover:underline flex items-center gap-0.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              Map <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
