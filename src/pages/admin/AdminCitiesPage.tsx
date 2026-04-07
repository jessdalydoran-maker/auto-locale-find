import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

export default function AdminCitiesPage() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: cities } = useQuery({
    queryKey: ["admin-cities-full"],
    queryFn: async () => {
      const { data } = await supabase.from("cities").select("*").order("name");
      return data || [];
    },
  });

  const deleteCity = async (id: string) => {
    if (!confirm("Delete this city? This may affect listings linked to it.")) return;
    const { error } = await supabase.from("cities").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("City deleted");
    qc.invalidateQueries({ queryKey: ["admin-cities-full"] });
  };

  const editCity = cities?.find((c) => c.id === editId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl text-foreground">Cities</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add City
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities?.map((city) => (
          <div key={city.id} className="bg-card rounded-xl border border-border overflow-hidden group">
            {city.image_url ? (
              <img src={city.image_url} alt={city.image_alt || city.name} className="w-full h-28 object-cover" />
            ) : (
              <div className="w-full h-28 bg-muted flex items-center justify-center">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground">{city.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditId(city.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCity(city.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{city.county || city.country} · {city.slug}</p>
              {city.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{city.description}</p>}
            </div>
          </div>
        ))}
      </div>

      <CitySheet
        city={editCity}
        open={!!editId}
        onClose={() => setEditId(null)}
        qc={qc}
        mode="edit"
      />
      <CitySheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        qc={qc}
        mode="add"
      />
    </div>
  );
}

function CitySheet({ city, open, onClose, qc, mode }: any) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  if (isEdit && city && form._id !== city.id) {
    setTimeout(() => setForm({ ...city, _id: city.id }), 0);
  }

  const save = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: form.description || null,
      county: form.county || null,
      country: form.country || "UK",
      image_url: form.image_url || null,
      image_alt: form.image_alt || form.name,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    };

    if (isEdit && city) {
      const { error } = await supabase.from("cities").update(payload).eq("id", city.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("City updated");
    } else {
      const { error } = await supabase.from("cities").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("City created");
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["admin-cities-full"] });
    qc.invalidateQueries({ queryKey: ["admin-cities"] });
    onClose();
    if (!isEdit) setForm({});
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit City" : "Add City"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Image</label>
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              folder="cities"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Slug</label>
            <Input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">County</label>
              <Input value={form.county || ""} onChange={(e) => setForm({ ...form, county: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Country</label>
              <Input value={form.country || "UK"} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Latitude</label>
              <Input type="number" step="any" value={form.latitude ?? ""} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Longitude</label>
              <Input type="number" step="any" value={form.longitude ?? ""} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Image Alt Text</label>
            <Input value={form.image_alt || ""} onChange={(e) => setForm({ ...form, image_alt: e.target.value })} />
          </div>
          <Button className="w-full" onClick={save} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update City" : "Create City"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
