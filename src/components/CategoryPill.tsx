import { Link } from "react-router-dom";
import { Utensils, Coffee, Wine, Compass, Dumbbell, Egg, Pizza, Store } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  utensils: <Utensils className="h-5 w-5" />,
  coffee: <Coffee className="h-5 w-5" />,
  wine: <Wine className="h-5 w-5" />,
  compass: <Compass className="h-5 w-5" />,
  dumbbell: <Dumbbell className="h-5 w-5" />,
  egg: <Egg className="h-5 w-5" />,
  pizza: <Pizza className="h-5 w-5" />,
  store: <Store className="h-5 w-5" />,
};

interface CategoryPillProps {
  name: string;
  slug: string;
  icon: string | null;
  citySlug?: string;
}

export const CategoryPill = ({ name, slug, icon, citySlug }: CategoryPillProps) => {
  const to = citySlug ? `/${citySlug}?category=${slug}` : `/categories`;

  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full text-sm font-medium text-foreground hover:border-teal hover:text-teal transition-all card-shadow hover:card-shadow-hover"
    >
      {icon && iconMap[icon] ? (
        <span className="text-teal">{iconMap[icon]}</span>
      ) : null}
      {name}
    </Link>
  );
};
