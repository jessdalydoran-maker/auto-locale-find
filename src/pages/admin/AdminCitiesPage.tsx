import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function AdminCitiesPage() {
  const { data: cities } = useQuery({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const { data } = await supabase.from("cities").select("*").order("name");
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-xl text-foreground">Cities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities?.map((city) => (
          <div key={city.id} className="bg-card rounded-xl p-4 border border-border">
            <h3 className="font-display font-semibold text-foreground">{city.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{city.slug} · {city.county || city.country}</p>
            {city.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{city.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
