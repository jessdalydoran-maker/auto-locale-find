import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ImageUpload from "@/components/admin/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isSameMonth } from "date-fns";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

export default function AdminEventsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());

  const { data: events } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, cities(name), categories(name)")
        .order("date_start", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["admin-cities"],
    queryFn: async () => { const { data } = await supabase.from("cities").select("id, name"); return data || []; },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => { const { data } = await supabase.from("categories").select("id, name").eq("is_active", true); return data || []; },
  });

  const calDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event deleted");
    qc.invalidateQueries({ queryKey: ["admin-events"] });
  };

  const editEvent = events?.find((e) => e.id === editId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl text-foreground">Events</h1>
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>List</Button>
          <Button variant={view === "calendar" ? "default" : "outline"} size="sm" onClick={() => setView("calendar")}>
            <CalendarDays className="h-4 w-4 mr-1" />Calendar
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Event
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Venue</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {events?.map((ev) => (
                  <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setEditId(ev.id)}>
                    <td className="p-3 font-medium text-foreground text-xs">{ev.title}</td>
                    <td className="p-3 text-xs text-muted-foreground">{ev.date_start}</td>
                    <td className="p-3 text-xs text-muted-foreground">{(ev.cities as any)?.name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{ev.venue_name || "—"}</td>
                    <td className="p-3">
                      <Badge variant={ev.status === "active" ? "default" : "secondary"} className="text-[10px]">{ev.status}</Badge>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteEvent(ev.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border text-xs text-muted-foreground">{events?.length ?? 0} events</div>
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => setCalMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}>←</Button>
            <h2 className="font-display font-semibold">{format(calMonth, "MMMM yyyy")}</h2>
            <Button variant="outline" size="sm" onClick={() => setCalMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}>→</Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground p-1">{d}</div>
            ))}
            {/* padding for start day */}
            {Array.from({ length: (calDays[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {calDays.map((day) => {
              const dayEvents = events?.filter((e) => isSameDay(parseISO(e.date_start), day)) || [];
              return (
                <div key={day.toISOString()} className="min-h-[60px] p-1 border border-border rounded text-xs">
                  <div className="font-medium text-muted-foreground">{format(day, "d")}</div>
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div key={ev.id} className="text-[9px] bg-accent/20 text-accent-foreground rounded px-1 mt-0.5 truncate cursor-pointer" onClick={() => setEditId(ev.id)}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayEvents.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Event Sheet */}
      <EventSheet
        event={editEvent}
        open={!!editId}
        onClose={() => setEditId(null)}
        cities={cities || []}
        categories={categories || []}
        qc={qc}
        mode="edit"
      />

      {/* Add Event Sheet */}
      <EventSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        cities={cities || []}
        categories={categories || []}
        qc={qc}
        mode="add"
      />
    </div>
  );
}

function EventSheet({ event, open, onClose, cities, categories, qc, mode }: any) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  if (isEdit && event && form._id !== event.id) {
    setTimeout(() => setForm({ ...event, _id: event.id }), 0);
  }
  if (!isEdit && !open) {
    // reset on close
  }

  const save = async () => {
    if (!form.title || !form.city_id || !form.date_start) {
      toast.error("Title, city, and start date are required");
      return;
    }
    setSaving(true);
    const payload: any = {
      title: form.title,
      description: form.description || null,
      short_description: form.short_description || null,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      date_start: form.date_start,
      date_end: form.date_end || null,
      time_start: form.time_start || null,
      time_end: form.time_end || null,
      city_id: form.city_id,
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      ticket_url: form.ticket_url || null,
      is_featured: form.is_featured || false,
      is_free: form.is_free || false,
      is_family_friendly: form.is_family_friendly || false,
      status: form.status || "active",
    };

    if (isEdit && event) {
      const { error } = await supabase.from("events").update(payload).eq("id", event.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Event updated");
    } else {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      payload.slug = slug;
      const { error } = await supabase.from("events").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Event created");
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["admin-events"] });
    onClose();
    if (!isEdit) setForm({});
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Event" : "Add Event"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start Date *</label>
              <Input type="date" value={form.date_start || ""} onChange={(e) => setForm({ ...form, date_start: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <Input type="date" value={form.date_end || ""} onChange={(e) => setForm({ ...form, date_end: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start Time</label>
              <Input type="time" value={form.time_start || ""} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End Time</label>
              <Input type="time" value={form.time_end || ""} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Venue Name</label>
            <Input value={form.venue_name || ""} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Venue Address</label>
            <Input value={form.venue_address || ""} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">City *</label>
              <Select value={form.city_id || ""} onValueChange={(v) => setForm({ ...form, city_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={form.category_id || ""} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Image</label>
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              folder="events"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Ticket URL</label>
            <Input value={form.ticket_url || ""} onChange={(e) => setForm({ ...form, ticket_url: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={form.is_featured || false} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              <span className="text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={form.is_free || false} onCheckedChange={(v) => setForm({ ...form, is_free: v })} />
              <span className="text-sm">Free</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={form.is_family_friendly || false} onCheckedChange={(v) => setForm({ ...form, is_family_friendly: v })} />
              <span className="text-sm">Family Friendly</span>
            </label>
          </div>
          {isEdit && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button className="w-full" onClick={save} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
