import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { setPageCanonical } from "@/lib/canonical";
import { useEffect } from "react";
import { Utensils, Coffee, Wine, Compass, Dumbbell, Egg, Pizza, Store, Rainbow } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  utensils: <Utensils className="h-8 w-8" />,
  coffee: <Coffee className="h-8 w-8" />,
  wine: <Wine className="h-8 w-8" />,
  compass: <Compass className="h-8 w-8" />,
  dumbbell: <Dumbbell className="h-8 w-8" />,
  egg: <Egg className="h-8 w-8" />,
  pizza: <Pizza className="h-8 w-8" />,
  store: <Store className="h-8 w-8" />,
  rainbow: <Rainbow className="h-8 w-8" />,
};

const CategoriesPage = () => {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => { setPageCanonical("/categories"); }, []);

  return (
    <Layout>
      <section className="bg-primary py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display font-bold text-2xl md:text-4xl text-primary-foreground">
            Browse by Category
          </h1>
          <p className="text-primary-foreground/60 text-sm mt-2">
            Find the best places by type across all cities.
          </p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories?.map((cat, i) => (
            <div
              key={cat.id}
              className="bg-card rounded-xl p-6 card-shadow hover:card-shadow-hover transition-all animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-teal/10 flex items-center justify-center text-teal mb-4">
                {cat.icon && iconMap[cat.icon] ? iconMap[cat.icon] : <Compass className="h-8 w-8" />}
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">{cat.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
              <div className="flex flex-wrap gap-1">
                {cities?.slice(0, 3).map((city) => (
                  <Link
                    key={city.id}
                    to={`/best-${cat.slug}-${city.slug}`}
                    className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CategoriesPage;
