import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-all"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data || [];
    },
  });

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("categories").update({ is_active: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-categories-all"] });
    toast.success(`Category ${!current ? "activated" : "deactivated"}`);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Listings using it may be affected.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Category deleted");
    qc.invalidateQueries({ queryKey: ["admin-categories-all"] });
  };

  const editCat = categories?.find((c) => c.id === editId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl text-foreground">Categories</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Icon</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((cat) => (
              <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">{cat.name}</td>
                <td className="p-3 text-xs text-muted-foreground">{cat.slug}</td>
                <td className="p-3 text-xs text-muted-foreground">{cat.icon || "—"}</td>
                <td className="p-3">
                  <Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat.id, cat.is_active)} />
                </td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditId(cat.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCategory(cat.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t border-border text-xs text-muted-foreground">{categories?.length ?? 0} categories</div>
      </div>

      <CategorySheet cat={editCat} open={!!editId} onClose={() => setEditId(null)} qc={qc} mode="edit" />
      <CategorySheet open={showAdd} onClose={() => setShowAdd(false)} qc={qc} mode="add" />
    </div>
  );
}

function CategorySheet({ cat, open, onClose, qc, mode }: any) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  if (isEdit && cat && form._id !== cat.id) {
    setTimeout(() => setForm({ ...cat, _id: cat.id }), 0);
  }

  const save = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: form.description || null,
      icon: form.icon || null,
      is_active: form.is_active ?? true,
    };

    if (isEdit && cat) {
      const { error } = await supabase.from("categories").update(payload).eq("id", cat.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Category created");
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["admin-categories-all"] });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    onClose();
    if (!isEdit) setForm({});
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Category" : "Add Category"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
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
          <div>
            <label className="text-xs font-medium text-muted-foreground">Icon (emoji or lucide name)</label>
            <Input value={form.icon || ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🍽️ or utensils" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <span className="text-sm">Active</span>
          </label>
          <Button className="w-full" onClick={save} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
