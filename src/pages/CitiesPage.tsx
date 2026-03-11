import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { CityCard } from "@/components/CityCard";
import { setPageCanonical } from "@/lib/canonical";
import { useEffect } from "react";

const CitiesPage = () => {
  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <section className="bg-primary py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display font-bold text-2xl md:text-4xl text-primary-foreground">
            Explore Cities
          </h1>
          <p className="text-primary-foreground/60 text-sm mt-2">
            Discover the best places across the UK's top cities.
          </p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities?.map((city, i) => (
            <CityCard
              key={city.id}
              name={city.name}
              slug={city.slug}
              imageUrl={city.image_url}
              description={city.description}
              index={i}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CitiesPage;
