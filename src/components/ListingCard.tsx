import { Link } from "react-router-dom";
import { Star, MapPin, ExternalLink } from "lucide-react";
import { getImageUrl, generateListingAltText, isPlaceholderImage, buildImageErrorHandler } from "@/lib/image-utils";
import { useMemo } from "react";

interface ListingCardProps {
  name: string;
  slug: string;
  citySlug: string;
  shortDescription: string;
  rating: number | null;
  reviewCount: number;
  imageUrl: string | null;
  imageSource?: string | null;
  imageAlt?: string | null;
  imageStatus?: string | null;
  address: string | null;
  priceLevel: string | null;
  googleMapsLink: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  neighbourhoodName?: string | null;
  cityName?: string | null;
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
  imageSource,
  imageAlt,
  imageStatus,
  address,
  priceLevel,
  googleMapsLink,
  categorySlug,
  categoryName,
  neighbourhoodName,
  cityName,
  isFeatured,
  index = 0,
}: ListingCardProps) => {
  const resolvedImage = getImageUrl(imageUrl, imageSource, categorySlug, citySlug, imageStatus, name);
  const usingPlaceholder = isPlaceholderImage(resolvedImage) || imageStatus !== "verified";
  const altText = imageAlt && !usingPlaceholder
    ? imageAlt
    : generateListingAltText(name, categoryName, neighbourhoodName, cityName, usingPlaceholder);

  const handleImageError = useMemo(
    () => buildImageErrorHandler(categorySlug, name),
    [categorySlug, name]
  );

  const detailUrl = `/place/${slug}`;

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
            onError={handleImageError}
          />
          {categoryName && (
            <span className="absolute top-2.5 left-2.5 bg-teal text-teal-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
              {categoryName}
            </span>
          )}
          {isFeatured && !categoryName && (
            <span className="absolute top-2.5 left-2.5 bg-teal text-teal-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
              Featured
            </span>
          )}
          {priceLevel && (
            <span className="absolute top-2.5 right-2.5 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-0.5 rounded">
              {priceLevel}
            </span>
          )}
        </div>
      </Link>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link
            to={detailUrl}
            className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {name}
          </Link>
          {rating != null && rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-foreground">{rating}</span>
              <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2 leading-relaxed">{shortDescription}</p>

        <div className="flex items-center justify-between">
          {address ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{address}</span>
            </div>
          ) : cityName ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{cityName}{neighbourhoodName ? `, ${neighbourhoodName}` : ""}</span>
            </div>
          ) : null}
          {googleMapsLink && (
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary hover:underline flex items-center gap-0.5 shrink-0"
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
