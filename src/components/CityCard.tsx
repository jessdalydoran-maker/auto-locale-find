import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

interface CityCardProps {
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string | null;
  listingCount?: number;
  index?: number;
}

export const CityCard = ({ name, slug, imageUrl, description, listingCount, index = 0 }: CityCardProps) => {
  return (
    <Link
      to={`/${slug}`}
      className="group block bg-card rounded-lg border border-border overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={imageUrl || "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-3.5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-1">{name}</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MapPin className="h-3 w-3" />
          {listingCount !== undefined ? (
            <span>{listingCount} places</span>
          ) : (
            <span className="line-clamp-1">{description}</span>
          )}
        </div>
      </div>
    </Link>
  );
};
