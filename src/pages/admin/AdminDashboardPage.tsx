import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUALITY_THRESHOLDS } from "@/lib/listing-quality";
import { BarChart3, List, Image, Star, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

export default function AdminDashboardPage() {
  const { data: listings } = useQuery({
    queryKey: ["admin-listings-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, name, rating, review_count, short_description, address, image_url, is_featured, is_approved, is_archived, category_id, city_id, categories(name), cities(name)");
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["admin-events-count"],
    queryFn: async () => {
      const { count } = await supabase.from("events").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const { data } = await supabase.from("cities").select("id, name");
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, is_active");
      return data || [];
    },
  });

  const stats = useMemo(() => {
    if (!listings) return null;
    const total = listings.length;
    const featured = listings.filter((l) => l.is_featured).length;
    const withImages = listings.filter((l) => l.image_url).length;
    const withoutImages = total - withImages;
    const quality = listings.filter(
      (l) =>
        (l.rating ?? 0) >= QUALITY_THRESHOLDS.MIN_RATING &&
        (l.review_count ?? 0) >= QUALITY_THRESHOLDS.MIN_REVIEW_COUNT &&
        l.image_url &&
        l.short_description
    ).length;

    // by city
    const cityMap = new Map<string, number>();
    listings.forEach((l) => {
      const name = (l.cities as any)?.name || "Unknown";
      cityMap.set(name, (cityMap.get(name) || 0) + 1);
    });
    const byCitySorted = [...cityMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    // by category
    const catMap = new Map<string, number>();
    listings.forEach((l) => {
      const name = (l.categories as any)?.name || "Unknown";
      catMap.set(name, (catMap.get(name) || 0) + 1);
    });
    const byCatSorted = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    return { total, featured, withImages, withoutImages, quality, byCitySorted, byCatSorted };
  }, [listings]);

  const cards = [
    { label: "Total Listings", value: stats?.total ?? "—", icon: List, color: "text-foreground" },
    { label: "Featured", value: stats?.featured ?? "—", icon: Star, color: "text-amber-500" },
    { label: "With Images", value: stats?.withImages ?? "—", icon: Image, color: "text-green-600" },
    { label: "No Image", value: stats?.withoutImages ?? "—", icon: AlertTriangle, color: "text-destructive" },
    { label: "Quality Pass", value: stats?.quality ?? "—", icon: CheckCircle2, color: "text-green-600" },
    { label: "Events", value: events ?? "—", icon: BarChart3, color: "text-foreground" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-xl text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
              <c.icon className="h-3.5 w-3.5" />
              {c.label}
            </div>
            <p className={`font-display font-bold text-2xl ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By City */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-display font-semibold text-foreground text-sm mb-4">Listings by City</h2>
          <div className="space-y-2">
            {stats?.byCitySorted.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(count / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-display font-semibold text-foreground text-sm mb-4">Listings by Category</h2>
          <div className="space-y-2">
            {stats?.byCatSorted.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
