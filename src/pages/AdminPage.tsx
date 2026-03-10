import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Layers, MapPin, TrendingUp } from "lucide-react";

const AdminPage = () => {
  const { data: cities } = useQuery({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, cities(name), categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pageViews } = useQuery({
    queryKey: ["admin-pageviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_views")
        .select("*")
        .order("date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const stats = [
    { label: "Cities", value: cities?.length || 0, icon: MapPin },
    { label: "Categories", value: categories?.length || 0, icon: Layers },
    { label: "Listings", value: listings?.length || 0, icon: TrendingUp },
    { label: "Page Views", value: pageViews?.reduce((a, p) => a + p.view_count, 0) || 0, icon: BarChart3 },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display font-bold text-2xl text-foreground mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-4 card-shadow">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <stat.icon className="h-4 w-4" />
                {stat.label}
              </div>
              <p className="font-display font-bold text-2xl text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="listings">
          <TabsList className="mb-6">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <div className="bg-card rounded-xl card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">City</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Rating</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings?.map((listing) => (
                      <tr key={listing.id} className="border-b border-border last:border-0">
                        <td className="p-4 font-medium text-foreground">{listing.name}</td>
                        <td className="p-4 text-muted-foreground">{(listing.cities as any)?.name}</td>
                        <td className="p-4 text-muted-foreground">{(listing.categories as any)?.name}</td>
                        <td className="p-4">{listing.rating}</td>
                        <td className="p-4">
                          <Badge variant={listing.is_approved ? "default" : "secondary"}>
                            {listing.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cities">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities?.map((city) => (
                <div key={city.id} className="bg-card rounded-xl p-4 card-shadow">
                  <h3 className="font-display font-semibold text-foreground">{city.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{city.slug}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories?.map((cat) => (
                <div key={cat.id} className="bg-card rounded-xl p-4 card-shadow flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cat.slug}</p>
                  </div>
                  <Badge variant={cat.is_active ? "default" : "secondary"}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Recent Page Views</h3>
              {pageViews && pageViews.length > 0 ? (
                <div className="space-y-2">
                  {pageViews.map((pv) => (
                    <div key={pv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-foreground">{pv.page_path}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{pv.date}</span>
                        <Badge variant="secondary">{pv.view_count} views</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No page views recorded yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPage;
