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
      className="group relative block rounded-xl overflow-hidden aspect-[4/3] card-shadow hover:card-shadow-hover transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <img
        src={imageUrl || "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600"}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-display font-bold text-lg text-primary-foreground mb-1">{name}</h3>
        <div className="flex items-center gap-1 text-primary-foreground/80 text-sm">
          <MapPin className="h-3.5 w-3.5" />
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
