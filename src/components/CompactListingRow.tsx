import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";

interface CompactListingRowProps {
  name: string;
  slug: string;
  shortDescription: string;
  rating: number | null;
  reviewCount: number;
  address: string | null;
  categoryName?: string | null;
  cityName?: string | null;
}

export const CompactListingRow = ({
  name,
  slug,
  shortDescription,
  rating,
  reviewCount,
  address,
  categoryName,
  cityName,
}: CompactListingRowProps) => {
  return (
    <Link
      to={`/place/${slug}`}
      className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-muted/60 transition-colors group"
    >
      {/* Name + category */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </span>
          {categoryName && (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
              {categoryName}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{shortDescription}</p>
      </div>

      {/* Rating */}
      {rating != null && rating > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-foreground">{rating}</span>
          <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
        </div>
      )}

      {/* Location */}
      {(address || cityName) && (
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 max-w-[140px]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{address || cityName}</span>
        </div>
      )}
    </Link>
  );
};
