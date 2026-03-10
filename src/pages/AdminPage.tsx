import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  BarChart3, Layers, MapPin, TrendingUp, Play, Settings, Clock,
  CheckCircle2, XCircle, AlertTriangle, Archive, RefreshCw, FileText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AdminPage = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

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

  const { data: automationLogs } = useQuery({
    queryKey: ["admin-automation-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: automationSettings } = useQuery({
    queryKey: ["admin-automation-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_settings")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: pageQuality } = useQuery({
    queryKey: ["admin-page-quality"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_quality")
        .select("*")
        .order("content_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const settingsMap = new Map(
    automationSettings?.map((s) => [s.key, s.value]) || []
  );

  const runWeeklyUpdate = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-update", {
        headers: { "x-manual-run": "true" },
      });
      if (error) throw error;
      toast.success(
        `Update complete: ${data.listings_added} added, ${data.listings_updated} updated, ${data.events_expired} events expired, ${data.duplicates_merged} duplicates merged`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-automation-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-page-quality"] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch (err) {
      toast.error("Weekly update failed: " + String(err));
    } finally {
      setIsRunning(false);
    }
  };

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

        <Tabs defaultValue="automation">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="pages">Page Quality</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* ─── AUTOMATION TAB ─── */}
          <TabsContent value="automation">
            <div className="space-y-6">
              {/* Controls */}
              <div className="bg-card rounded-xl p-6 card-shadow">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" /> Automation Controls
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Weekly Automation</p>
                        <p className="text-xs text-muted-foreground">Runs every Sunday at 3 AM</p>
                      </div>
                      <Badge variant={settingsMap.get("automation_enabled") === "true" ? "default" : "secondary"}>
                        {settingsMap.get("automation_enabled") === "true" ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Priority City</p>
                        <p className="text-xs text-muted-foreground">Focus automation on this city first</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {settingsMap.get("priority_city") || "belfast"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Category/City Threshold</p>
                        <p className="text-xs text-muted-foreground">Min listings for page publishing</p>
                      </div>
                      <Badge variant="secondary">
                        {settingsMap.get("content_threshold_category_city") || "5"} listings
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={runWeeklyUpdate}
                      disabled={isRunning}
                      className="w-full"
                    >
                      {isRunning ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</>
                      ) : (
                        <><Play className="h-4 w-4 mr-2" /> Run Weekly Update Now</>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {settingsMap.get("last_manual_run")
                        ? `Last manual run: ${new Date(settingsMap.get("last_manual_run")!).toLocaleString()}`
                        : "No manual runs yet"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Logs */}
              <div className="bg-card rounded-xl card-shadow overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Update Logs
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Added</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Updated</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Archived</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Expired</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Dupes</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Pages +/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {automationLogs && automationLogs.length > 0 ? (
                        automationLogs.map((log) => (
                          <tr key={log.id} className="border-b border-border last:border-0">
                            <td className="p-3 text-foreground text-xs">
                              {new Date(log.started_at).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary" className="text-xs">{log.run_type}</Badge>
                            </td>
                            <td className="p-3">
                              {log.status === "completed" && (
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                                </Badge>
                              )}
                              {log.status === "running" && (
                                <Badge variant="secondary" className="text-xs">
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Running
                                </Badge>
                              )}
                              {log.status === "failed" && (
                                <Badge variant="destructive" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1" /> Failed
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-foreground">{log.listings_added}</td>
                            <td className="p-3 text-foreground">{log.listings_updated}</td>
                            <td className="p-3 text-foreground">{log.listings_archived}</td>
                            <td className="p-3 text-foreground">{log.events_expired}</td>
                            <td className="p-3 text-foreground">{log.duplicates_merged}</td>
                            <td className="p-3 text-foreground">
                              <span className="text-green-600">+{log.pages_published}</span>
                              {" / "}
                              <span className="text-red-500">-{log.pages_unpublished}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-muted-foreground text-sm">
                            No automation runs yet. Click "Run Weekly Update Now" to start.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── LISTINGS TAB ─── */}
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

          {/* ─── PAGE QUALITY TAB ─── */}
          <TabsContent value="pages">
            <div className="bg-card rounded-xl card-shadow overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-display font-semibold text-foreground">Page Quality Overview</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Pages need ≥5 listings to be published. Run the weekly update to refresh.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-muted-foreground">Page</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Content</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Last Checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageQuality && pageQuality.length > 0 ? (
                      pageQuality.map((pq) => (
                        <tr key={pq.id} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium text-foreground text-xs font-mono">/{pq.page_slug}</td>
                          <td className="p-3">
                            <Badge variant={pq.content_count >= 5 ? "default" : "secondary"}>
                              {pq.content_count} items
                            </Badge>
                          </td>
                          <td className="p-3">
                            {pq.is_published ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Unpublished
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(pq.last_checked_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground text-sm">
                          No page quality data yet. Run the weekly update to populate.
                        </td>
                      </tr>
                    )}
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
