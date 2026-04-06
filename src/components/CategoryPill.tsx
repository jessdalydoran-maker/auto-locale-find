import { Link } from "react-router-dom";
import { Utensils, Coffee, Wine, Compass, Dumbbell, Egg, Pizza, Store, Rainbow } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  utensils: <Utensils className="h-4 w-4" />,
  coffee: <Coffee className="h-4 w-4" />,
  wine: <Wine className="h-4 w-4" />,
  compass: <Compass className="h-4 w-4" />,
  dumbbell: <Dumbbell className="h-4 w-4" />,
  egg: <Egg className="h-4 w-4" />,
  pizza: <Pizza className="h-4 w-4" />,
  store: <Store className="h-4 w-4" />,
  rainbow: <Rainbow className="h-4 w-4" />,
};

interface CategoryPillProps {
  name: string; slug: string; icon: string | null; citySlug?: string;
}

export const CategoryPill = ({ name, slug, icon, citySlug }: CategoryPillProps) => {
  const to = citySlug ? `/${citySlug}?category=${slug}` : `/categories`;
  return (
    <Link
      to={to}
      className="group flex items-center gap-2.5 px-5 py-3 bg-card rounded-xl text-sm font-medium text-foreground hover:border-accent/50 hover:text-accent transition-all duration-200 card-shadow hover:card-shadow-hover border border-border"
    >
      {icon && iconMap[icon] ? (
        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
          {iconMap[icon]}
        </span>
      ) : null}
      {name}
    </Link>
  );
};
