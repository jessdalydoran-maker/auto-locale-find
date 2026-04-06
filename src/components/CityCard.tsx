import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { getImageUrl, generateCityAltText, buildImageErrorHandler } from "@/lib/image-utils";
import { useMemo } from "react";

interface CityCardProps {
  name: string; slug: string; imageUrl: string | null; imageAlt?: string | null;
  description: string | null; listingCount?: number; index?: number;
}

export const CityCard = ({ name, slug, imageUrl, imageAlt, description, listingCount, index = 0 }: CityCardProps) => {
  const resolvedImage = getImageUrl(imageUrl, "manual", undefined, slug);
  const altText = imageAlt || generateCityAltText(name);
  const handleImageError = useMemo(() => buildImageErrorHandler("things-to-do", name), [name]);

  return (
    <Link
      to={`/${slug}`}
      className="group block rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:scale-[1.02] animate-fade-in relative"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img src={resolvedImage} alt={altText}
          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
          loading="lazy" decoding="async" width={600} height={338} onError={handleImageError} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display font-bold text-lg text-white mb-0.5">{name}</h3>
          <div className="flex items-center gap-1.5 text-white/70 text-xs">
            <MapPin className="h-3 w-3" />
            {listingCount !== undefined ? (
              <span>{listingCount} guides</span>
            ) : (
              <span className="line-clamp-1">{description}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
