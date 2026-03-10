import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";

interface NeighbourhoodCardProps {
  name: string;
  slug: string;
  citySlug: string;
  description: string | null;
  index?: number;
}

export const NeighbourhoodCard = ({ name, slug, citySlug, description, index = 0 }: NeighbourhoodCardProps) => {
  return (
    <Link
      to={`/things-to-do-${slug}-${citySlug}`}
      className="group block p-4 bg-card border border-border rounded-lg card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
              {name}
            </h3>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0 mt-0.5" />
      </div>
    </Link>
  );
};
