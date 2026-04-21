import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataQualityDashboard } from "@/components/DataQualityDashboard";
import {
  Play, RefreshCw, TrendingUp, Calendar, Image, Settings,
  FileText, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminAutomationPage() {
  const qc = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [ingestionSourceType, setIngestionSourceType] = useState("all");

  const { data: automationLogs } = useQuery({
    queryKey: ["admin-automation-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("automation_logs").select("*").order("started_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: automationSettings } = useQuery({
    queryKey: ["admin-automation-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("automation_settings").select("*");
      return data || [];
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("*, cities(name), categories(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const settingsMap = new Map(automationSettings?.map((s) => [s.key, s.value]) || []);

  const runWeeklyUpdate = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-update", { headers: { "x-manual-run": "true" } });
      if (error) throw error;
      toast.success(`Update complete: ${data.listings_added} added, ${data.listings_updated} updated`);
      qc.invalidateQueries({ queryKey: ["admin-automation-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch (err) { toast.error("Failed: " + String(err)); }
    finally { setIsRunning(false); }
  };

  const runHarvester = async () => {
    setIsHarvesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("harvest-search-trends");
      if (error) throw error;
      toast.success(`Harvester complete: ${data.suggestions_found} suggestions`);
    } catch (err) { toast.error("Failed: " + String(err)); }
    finally { setIsHarvesting(false); }
  };

  const runEventIngestion = async () => {
    setIsIngesting(true);
    try {
      const body: any = { max_sources: 15 };
      if (ingestionSourceType !== "all") body.source_type = ingestionSourceType;
      const { data, error } = await supabase.functions.invoke("ingest-events", { body });
      if (error) throw error;
      toast.success(`Events: ${data.stats?.events_added || 0} added`);
    } catch (err) { toast.error("Failed: " + String(err)); }
    finally { setIsIngesting(false); }
  };

  const runImageScraper = async () => {
    setIsScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-venue-images", { body: { batch_size: 15 } });
      if (error) throw error;
      toast.success(`Images: ${data.images_found} found out of ${data.processed}`);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch (err) { toast.error("Failed: " + String(err)); }
    finally { setIsScraping(false); }
  };

  const runGoogleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-google-images", { body: { batch_size: 25 } });
      if (error) throw error;
      toast.success(`Google: ${data.updated} updated (${data.places_hits} photos, ${data.streetview_hits} street view) · ${data.remaining} remaining`);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch (err) { toast.error("Failed: " + String(err)); }
    finally { setIsBackfilling(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-xl text-foreground">Automation & Data Quality</h1>

      {/* Controls */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" /> Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Weekly Automation</p>
                <p className="text-xs text-muted-foreground">Runs every Sunday 3 AM</p>
              </div>
              <Badge variant={settingsMap.get("automation_enabled") === "true" ? "default" : "secondary"}>
                {settingsMap.get("automation_enabled") === "true" ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={runWeeklyUpdate} disabled={isRunning} size="sm">
              {isRunning ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running…</> : <><Play className="h-3 w-3 mr-1" />Weekly Update</>}
            </Button>
            <Button onClick={runHarvester} disabled={isHarvesting} size="sm" variant="outline">
              {isHarvesting ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Harvesting…</> : <><TrendingUp className="h-3 w-3 mr-1" />Search Harvester</>}
            </Button>
            <div className="flex gap-1 flex-wrap">
              {["all", "council", "venue", "festival"].map((t) => (
                <button key={t} onClick={() => setIngestionSourceType(t)} className={`px-2 py-0.5 text-[10px] rounded ${ingestionSourceType === t ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
            <Button onClick={runEventIngestion} disabled={isIngesting} size="sm" variant="outline">
              {isIngesting ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Ingesting…</> : <><Calendar className="h-3 w-3 mr-1" />Event Ingestion</>}
            </Button>
            <Button onClick={runImageScraper} disabled={isScraping} size="sm" variant="outline">
              {isScraping ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Scraping…</> : <><Image className="h-3 w-3 mr-1" />Scrape Images</>}
            </Button>
            <Button onClick={runGoogleBackfill} disabled={isBackfilling} size="sm" variant="outline">
              {isBackfilling ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Backfilling…</> : <><Image className="h-3 w-3 mr-1" />Backfill Google Images</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Recent Logs
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Added</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Updated</th>
              </tr>
            </thead>
            <tbody>
              {automationLogs?.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-xs">{new Date(log.started_at).toLocaleString()}</td>
                  <td className="p-3"><Badge variant="secondary" className="text-xs">{log.run_type}</Badge></td>
                  <td className="p-3">
                    <Badge variant={log.status === "completed" ? "default" : log.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                      {log.status === "completed" ? <><CheckCircle2 className="h-3 w-3 mr-1" />Done</> : log.status === "failed" ? <><XCircle className="h-3 w-3 mr-1" />Failed</> : "Running"}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs">{log.listings_added}</td>
                  <td className="p-3 text-xs">{log.listings_updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Quality */}
      <DataQualityDashboard listings={listings || []} queryClient={qc} />
    </div>
  );
}
