import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, Search, ChevronDown, X, Upload } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SortKey = "name" | "rating" | "review_count" | "created_at";

export default function AdminListingsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [approvedFilter, setApprovedFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: listings } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, cities(name), categories(name, id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const { data } = await supabase.from("cities").select("id, name, slug");
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug").eq("is_active", true);
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (!listings) return [];
    return listings
      .filter((l) => {
        if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (cityFilter !== "all" && l.city_id !== cityFilter) return false;
        if (catFilter !== "all" && l.category_id !== catFilter) return false;
        if (featuredFilter === "yes" && !l.is_featured) return false;
        if (featuredFilter === "no" && l.is_featured) return false;
        if (approvedFilter === "yes" && !l.is_approved) return false;
        if (approvedFilter === "no" && l.is_approved) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
        return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
  }, [listings, search, cityFilter, catFilter, featuredFilter, approvedFilter, sortKey, sortAsc]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  };

  const bulkAction = async (action: "feature" | "unfeature" | "approve" | "unapprove" | "archive") => {
    const ids = [...selected];
    if (!ids.length) return;
    const updates: any = {};
    if (action === "feature") updates.is_featured = true;
    if (action === "unfeature") updates.is_featured = false;
    if (action === "approve") updates.is_approved = true;
    if (action === "unapprove") updates.is_approved = false;
    if (action === "archive") updates.is_archived = true;
    for (let i = 0; i < ids.length; i += 50) {
      await supabase.from("listings").update(updates).in("id", ids.slice(i, i + 50));
    }
    toast.success(`${action} applied to ${ids.length} listings`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-listings"] });
  };

  const editListing = listings?.find((l) => l.id === editId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl text-foreground">Listings</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Listing
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Featured" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Featured: All</SelectItem>
            <SelectItem value="yes">Featured</SelectItem>
            <SelectItem value="no">Not Featured</SelectItem>
          </SelectContent>
        </Select>
        <Select value={approvedFilter} onValueChange={setApprovedFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Approved" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Approved: All</SelectItem>
            <SelectItem value="yes">Approved</SelectItem>
            <SelectItem value="no">Not Approved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date Added</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="review_count">Reviews</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setSortAsc(!sortAsc)}>
          <ChevronDown className={`h-4 w-4 transition-transform ${sortAsc ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkAction("feature")}>Feature</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("unfeature")}>Unfeature</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("approve")}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("unapprove")}>Unapprove</Button>
          <Button size="sm" variant="destructive" onClick={() => bulkAction("archive")}>Archive</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 w-8">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                <th className="text-left p-3 font-medium text-muted-foreground">Image</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Rating</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Reviews</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => setEditId(l.id)}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)} />
                  </td>
                  <td className="p-3">
                    <div className="w-12 h-8 rounded overflow-hidden bg-muted">
                      {l.image_url ? (
                        <img src={l.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[9px]">N/A</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-foreground text-xs">
                    <div className="flex items-center gap-1">
                      {l.is_featured && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                      <span className="truncate max-w-[200px]">{l.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{(l.categories as any)?.name}</td>
                  <td className="p-3 text-muted-foreground text-xs">{(l.cities as any)?.name}</td>
                  <td className="p-3 text-xs">{l.rating ?? "—"}</td>
                  <td className="p-3 text-xs">{l.review_count ?? 0}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Badge variant={l.is_approved ? "default" : "secondary"} className="text-[10px]">
                        {l.is_approved ? "Live" : "Draft"}
                      </Badge>
                      {l.is_archived && <Badge variant="destructive" className="text-[10px]">Archived</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border text-xs text-muted-foreground">
          Showing {filtered.length} of {listings?.length ?? 0} listings
        </div>
      </div>

      {/* Edit Sheet */}
      <EditListingSheet
        listing={editListing}
        open={!!editId}
        onClose={() => setEditId(null)}
        cities={cities || []}
        categories={categories || []}
        qc={qc}
      />

      {/* Add Sheet */}
      <AddListingSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        cities={cities || []}
        categories={categories || []}
        qc={qc}
      />
    </div>
  );
}

/* ─── Edit Listing Sheet ─── */
function EditListingSheet({ listing, open, onClose, cities, categories, qc }: any) {
  const [form, setForm] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  // sync form when listing changes
  const key = listing?.id;
  useState(() => {});
  if (listing && form._id !== listing.id) {
    // reset form to listing values
    setTimeout(() => setForm({ ...listing, _id: listing.id }), 0);
  }

  const save = async () => {
    if (!listing) return;
    const { error } = await supabase.from("listings").update({
      name: form.name,
      short_description: form.short_description,
      category_id: form.category_id,
      address: form.address,
      phone: form.phone,
      website: form.website,
      is_featured: form.is_featured,
      is_approved: form.is_approved,
      image_url: form.image_url,
    }).eq("id", listing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing updated");
    qc.invalidateQueries({ queryKey: ["admin-listings"] });
    onClose();
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const path = `listings/${listing.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("venue-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("venue-images").getPublicUrl(path);
    setForm((f: any) => ({ ...f, image_url: publicUrl }));
    setUploading(false);
    toast.success("Image uploaded");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit Listing</SheetTitle>
        </SheetHeader>
        {listing && (
          <div className="space-y-4 mt-4">
            {/* Image */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Image</label>
              <ImageUpload
                value={form.image_url}
                onChange={(url) => setForm((f: any) => ({ ...f, image_url: url }))}
                folder={`listings/${listing.id}`}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Short Description</label>
              <Textarea value={form.short_description || ""} onChange={(e) => setForm({ ...form, short_description: e.target.value })} rows={3} />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={form.category_id || ""} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Website</label>
                <Input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_featured || false} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <span className="text-sm">Featured on partner sites</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_approved || false} onCheckedChange={(v) => setForm({ ...form, is_approved: v })} />
                <span className="text-sm">Approved (live)</span>
              </label>
            </div>

            <Button className="w-full" onClick={save}>Save Changes</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ─── Add Listing Sheet ─── */
function AddListingSheet({ open, onClose, cities, categories, qc }: any) {
  const [form, setForm] = useState<any>({
    name: "", short_description: "", category_id: "", city_id: "", address: "",
    phone: "", website: "", image_url: "", rating: "", review_count: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.category_id || !form.city_id) {
      toast.error("Name, category, and city are required");
      return;
    }
    setSaving(true);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("listings").insert({
      name: form.name,
      slug,
      short_description: form.short_description || null,
      category_id: form.category_id,
      city_id: form.city_id,
      address: form.address || null,
      phone: form.phone || null,
      website: form.website || null,
      image_url: form.image_url || null,
      rating: form.rating ? parseFloat(form.rating) : 0,
      review_count: form.review_count ? parseInt(form.review_count) : 0,
      is_approved: false,
      is_featured: false,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing created (draft)");
    qc.invalidateQueries({ queryKey: ["admin-listings"] });
    setForm({ name: "", short_description: "", category_id: "", city_id: "", address: "", phone: "", website: "", image_url: "", rating: "", review_count: "" });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add New Listing</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Short Description</label>
            <Textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category *</label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">City *</label>
              <Select value={form.city_id} onValueChange={(v) => setForm({ ...form, city_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Address</label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Website</label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Image</label>
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              folder="listings/new"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Rating</label>
              <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Review Count</label>
              <Input type="number" min="0" value={form.review_count} onChange={(e) => setForm({ ...form, review_count: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">New listings start as drafts (not approved, not featured). Review and approve from the listings table.</p>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Creating…" : "Create Listing"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
