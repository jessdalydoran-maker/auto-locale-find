import { Link } from "react-router-dom";
import { Star, MapPin, ExternalLink, TrendingUp } from "lucide-react";
import { getImageUrl, generateListingAltText, isPlaceholderImage, buildImageErrorHandler } from "@/lib/image-utils";
import { useMemo } from "react";

/** Map category slugs to their pill colour classes (HSL-based design tokens) */
const CATEGORY_PILL_COLORS: Record<string, string> = {
  restaurants: "bg-[hsl(15,80%,55%)] text-white",
  cafes: "bg-[hsl(25,70%,52%)] text-white",
  brunch: "bg-[hsl(30,80%,55%)] text-white",
  bars: "bg-[hsl(262,50%,42%)] text-white",
  "cocktail-bars": "bg-[hsl(280,55%,45%)] text-white",
  nightlife: "bg-[hsl(270,60%,35%)] text-white",
  pubs: "bg-[hsl(25,55%,40%)] text-white",
  "things-to-do": "bg-[hsl(200,60%,45%)] text-white",
  attractions: "bg-[hsl(210,55%,48%)] text-white",
  "family-activities": "bg-[hsl(145,50%,42%)] text-white",
  parks: "bg-[hsl(130,45%,40%)] text-white",
  museums: "bg-[hsl(220,45%,42%)] text-white",
  "live-music": "bg-[hsl(350,60%,50%)] text-white",
  hotels: "bg-[hsl(210,40%,45%)] text-white",
  accommodation: "bg-[hsl(210,40%,45%)] text-white",
  shopping: "bg-[hsl(330,50%,50%)] text-white",
  gyms: "bg-[hsl(175,50%,40%)] text-white",
  theatre: "bg-[hsl(340,55%,45%)] text-white",
};

const DEFAULT_PILL = "bg-primary text-primary-foreground";

/** Gradient class for category placeholder backgrounds */
function getCategoryGradientClass(categorySlug?: string | null): string {
  if (!categorySlug) return "gradient-default";
  const map: Record<string, string> = {
    restaurants: "gradient-restaurants",
    cafes: "gradient-cafes",
    brunch: "gradient-brunch",
    bars: "gradient-bars",
    "cocktail-bars": "gradient-cocktail-bars",
    nightlife: "gradient-nightlife",
    pubs: "gradient-pubs",
    "things-to-do": "gradient-things-to-do",
    attractions: "gradient-attractions",
    "family-activities": "gradient-family-activities",
    parks: "gradient-parks",
    museums: "gradient-museums",
    "live-music": "gradient-live-music",
    hotels: "gradient-hotels",
    accommodation: "gradient-hotels",
    shopping: "gradient-shopping",
    gyms: "gradient-gyms",
    theatre: "gradient-theatre",
  };
  return map[categorySlug] || "gradient-default";
}

export interface ListingCardProps {
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
  audienceTags?: string[] | null;
  description?: string | null;
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
  audienceTags,
  description,
}: ListingCardProps) => {
  const resolvedImage = getImageUrl(imageUrl, imageSource, categorySlug, citySlug, imageStatus, name, audienceTags, description || shortDescription);
  const hasRealImage = !!imageUrl && imageStatus === "verified";
  const usingPlaceholder = isPlaceholderImage(resolvedImage) || !hasRealImage;
  const altText = imageAlt && !usingPlaceholder
    ? imageAlt
    : generateListingAltText(name, categoryName, neighbourhoodName, cityName, usingPlaceholder);

  const handleImageError = useMemo(
    () => buildImageErrorHandler(categorySlug, name, audienceTags, description || shortDescription),
    [categorySlug, name, audienceTags, description, shortDescription]
  );

  const detailUrl = `/place/${slug}`;
  const isPopular = reviewCount >= 100;
  const pillColor = CATEGORY_PILL_COLORS[categorySlug || ""] || DEFAULT_PILL;

  // Render stars
  const renderStars = (r: number) => {
    const full = Math.floor(r);
    const hasHalf = r - full >= 0.3;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        );
      } else if (i === full && hasHalf) {
        stars.push(
          <div key={i} className="relative h-3.5 w-3.5">
            <Star className="absolute inset-0 h-3.5 w-3.5 text-muted-foreground/30" />
            <div className="absolute inset-0 overflow-hidden w-[50%]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="h-3.5 w-3.5 text-muted-foreground/30" />
        );
      }
    }
    return stars;
  };

  return (
    <div
      className="group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:card-shadow-lifted card-shadow animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link to={detailUrl} className="block">
        {/* Hero image — 16:9 */}
        <div className="relative aspect-video overflow-hidden rounded-t-xl">
          {usingPlaceholder && !resolvedImage.startsWith("http") ? (
            /* Pure gradient placeholder */
            <div className={`w-full h-full ${getCategoryGradientClass(categorySlug)} flex items-center justify-center`}>
              <span className="text-white/60 text-sm font-medium font-display">{categoryName || "Explore"}</span>
            </div>
          ) : (
            <img
              src={resolvedImage}
              alt={altText}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              width={640}
              height={360}
              onError={handleImageError}
            />
          )}

          {/* Gradient overlay at bottom for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Popular badge */}
          {isPopular && (
            <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
              <TrendingUp className="h-3 w-3" />
              Popular
            </span>
          )}

          {/* Price level */}
          {priceLevel && (
            <span className="absolute top-2.5 right-2.5 bg-card/90 backdrop-blur-sm text-foreground text-[11px] font-medium px-2 py-0.5 rounded-md shadow-sm">
              {priceLevel}
            </span>
          )}

          {/* Featured badge */}
          {isFeatured && !isPopular && (
            <span className="absolute top-2.5 left-2.5 bg-teal text-teal-foreground text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
              ★ Featured
            </span>
          )}
        </div>
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category pill */}
        {categoryName && (
          <span className={`self-start text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-2 ${pillColor}`}>
            {categoryName}
          </span>
        )}

        <Link
          to={detailUrl}
          className="font-display font-bold text-[15px] text-foreground hover:text-primary transition-colors line-clamp-1 mb-1"
        >
          {name}
        </Link>

        {/* Star rating */}
        {rating != null && rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {renderStars(rating)}
            </div>
            <span className="text-xs font-semibold text-foreground">{rating}</span>
            <span className="text-[11px] text-muted-foreground">({reviewCount})</span>
          </div>
        )}

        {/* Description — 2 lines max */}
        <p className="text-[13px] text-muted-foreground mb-3 line-clamp-2 leading-relaxed flex-1">
          {shortDescription}
        </p>

        {/* Address + map link */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          {address ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="line-clamp-1">{address}</span>
            </div>
          ) : cityName ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="line-clamp-1">{cityName}{neighbourhoodName ? `, ${neighbourhoodName}` : ""}</span>
            </div>
          ) : <div />}
          {googleMapsLink && (
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary font-medium hover:underline flex items-center gap-0.5 shrink-0 ml-2"
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
