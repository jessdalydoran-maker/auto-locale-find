import { Link } from "react-router-dom";
import { Star, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      className="group bg-card rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {isFeatured && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0 text-xs">
            Featured
          </Badge>
        )}
        {priceLevel && (
          <span className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded-md">
            {priceLevel}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link
            to={`/${citySlug}/${slug}`}
            className="font-display font-semibold text-foreground hover:text-accent transition-colors line-clamp-1"
          >
            {name}
          </Link>
          {rating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-foreground">{rating}</span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{shortDescription}</p>

        <div className="flex items-center justify-between">
          {address && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}
          {googleMapsLink && (
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Map <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
