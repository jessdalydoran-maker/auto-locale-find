import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function AdminCategoriesPage() {
  const { data: categories } = useQuery({
    queryKey: ["admin-categories-all"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-xl text-foreground">Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-foreground">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{cat.slug}</p>
            </div>
            <Badge variant={cat.is_active ? "default" : "secondary"}>
              {cat.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
