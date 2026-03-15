import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Tag, Calendar } from "lucide-react";
import { getAutocompleteSuggestions } from "@/lib/search-intent";
import { supabase } from "@/integrations/supabase/client";

interface SearchBarProps {
  onClose?: () => void;
  large?: boolean;
  placeholder?: string;
}

interface Suggestion {
  label: string;
  type: "venue" | "event" | "city" | "category" | "static";
  subtitle?: string;
  link?: string;
}

export const SearchBar = ({ onClose, large = false, placeholder = "Search by city, category or keyword..." }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Live autocomplete from DB + static suggestions
  const fetchSuggestions = useCallback(async (partial: string) => {
    if (partial.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const results: Suggestion[] = [];
    const lower = partial.toLowerCase();

    // Search listings by name, city name, and category name simultaneously
    const [byName, byCity, byCat, eventRes, cityRes, catRes] = await Promise.all([
      supabase
        .from("listings")
        .select("name, slug, cities!inner(name, slug), categories!inner(name, slug)")
        .ilike("name", `%${partial}%`)
        .limit(8),
      supabase
        .from("listings")
        .select("name, slug, cities!inner(name, slug), categories!inner(name, slug)")
        .ilike("cities.name", `%${partial}%`)
        .limit(10),
      supabase
        .from("listings")
        .select("name, slug, cities!inner(name, slug), categories!inner(name, slug)")
        .ilike("categories.name", `%${partial}%`)
        .limit(8),
      supabase
        .from("events")
        .select("title, slug")
        .eq("status", "active")
        .gte("date_start", new Date().toISOString().split("T")[0])
        .ilike("title", `%${partial}%`)
        .limit(3),
      supabase
        .from("cities")
        .select("name, slug")
        .ilike("name", `%${partial}%`)
        .limit(3),
      supabase
        .from("categories")
        .select("name, slug")
        .ilike("name", `%${partial}%`)
        .eq("is_active", true)
        .limit(3),
    ]);

    const seenIds = new Set<string>();
    const addListing = (l: any) => {
      const key = l.slug;
      if (seenIds.has(key)) return;
      seenIds.add(key);
      const cityName = (l.cities as any)?.name || "";
      const citySlug = (l.cities as any)?.slug || "";
      const catName = (l.categories as any)?.name || "";
      results.push({
        label: l.name,
        type: "venue",
        subtitle: `${catName} · ${cityName}`,
        link: `/${citySlug}/${l.slug}`,
      });
    };

    // Prioritise: city matches first (location-first), then name, then category
    for (const l of (byCity.data || [])) addListing(l);
    for (const l of (byName.data || [])) addListing(l);
    for (const l of (byCat.data || [])) addListing(l);

    // Events
    if (eventRes.data) {
      for (const e of eventRes.data) {
        results.push({ label: e.title, type: "event", link: `/event/${e.slug}` });
      }
    }

    // Cities as navigation options
    if (cityRes.data) {
      for (const c of cityRes.data) {
        results.push({ label: c.name, type: "city", subtitle: "View all listings", link: `/${c.slug}` });
      }
    }

    // Categories
    if (catRes.data) {
      for (const c of catRes.data) {
        results.push({ label: c.name, type: "category", subtitle: "Category", link: `/categories` });
      }
    }

    // Static fallback
    if (results.length < 4) {
      const staticSugs = getAutocompleteSuggestions(partial);
      for (const s of staticSugs) {
        if (!results.some(r => r.label.toLowerCase() === s.toLowerCase())) {
          results.push({ label: s, type: "static" });
        }
        if (results.length >= 10) break;
      }
    }

    setSuggestions(results.slice(0, 10));
    setSelectedIndex(-1);
    setShowSuggestions(results.length > 0);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doSearch = (q: string) => {
    if (q.trim()) {
      // Strip " – CityName" suffix for venue suggestions
      const clean = q.replace(/\s–\s.+$/, "").trim();
      navigate(`/search?q=${encodeURIComponent(clean)}`);
      setShowSuggestions(false);
      onClose?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      doSearch(suggestions[selectedIndex].label);
    } else {
      doSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const getIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "venue": return <MapPin className="h-3.5 w-3.5 shrink-0 opacity-40" />;
      case "event": return <Calendar className="h-3.5 w-3.5 shrink-0 opacity-40" />;
      case "city": return <MapPin className="h-3.5 w-3.5 shrink-0 opacity-40" />;
      case "category": return <Tag className="h-3.5 w-3.5 shrink-0 opacity-40" />;
      default: return <Search className="h-3.5 w-3.5 shrink-0 opacity-40" />;
    }
  };

  const getTypeLabel = (type: Suggestion["type"]) => {
    switch (type) {
      case "venue": return "Venue";
      case "event": return "Event";
      case "city": return "City";
      case "category": return "Category";
      default: return null;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 ${large ? 'h-[18px] w-[18px]' : 'h-4 w-4'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow ${
            large
              ? 'h-12 pl-11 pr-4 text-[15px] rounded-xl'
              : 'h-10 pl-10 pr-3 text-[13px] rounded-lg'
          }`}
          autoFocus
        />
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.label}`}
              type="button"
              className={`w-full text-left px-3.5 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors ${
                i === selectedIndex
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => doSearch(s.label)}
            >
              {getIcon(s.type)}
              <span className="flex-1 truncate">{s.label}</span>
              {getTypeLabel(s.type) && (
                <span className={`text-[10px] uppercase tracking-wider ${
                  i === selectedIndex ? "text-primary-foreground/60" : "text-muted-foreground/50"
                }`}>
                  {getTypeLabel(s.type)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
