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

  // Detect temporal intent from query
  const detectTemporalIntent = (q: string): { label: string; dateFrom: string; dateTo: string } | null => {
    const lower = q.toLowerCase();
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    if (lower.includes("tonight") || lower.includes("today")) {
      return { label: "Today", dateFrom: fmt(today), dateTo: fmt(today) };
    }
    if (lower.includes("tomorrow")) {
      const tom = new Date(today);
      tom.setDate(tom.getDate() + 1);
      return { label: "Tomorrow", dateFrom: fmt(tom), dateTo: fmt(tom) };
    }
    if (lower.includes("this weekend")) {
      const day = today.getDay(); // 0=Sun
      const fri = new Date(today);
      fri.setDate(today.getDate() + ((5 - day + 7) % 7));
      const sun = new Date(fri);
      sun.setDate(fri.getDate() + 2);
      return { label: "This Weekend", dateFrom: fmt(fri), dateTo: fmt(sun) };
    }
    if (lower.includes("next week") || lower.includes("next 7 days")) {
      const end = new Date(today);
      end.setDate(today.getDate() + 7);
      return { label: "Next 7 Days", dateFrom: fmt(today), dateTo: fmt(end) };
    }
    // Generic "what's on" / "events" without specific time → next 7 days
    if (/what'?s\s+on|whats\s+on/.test(lower) && !lower.includes("tonight") && !lower.includes("tomorrow") && !lower.includes("weekend")) {
      const end = new Date(today);
      end.setDate(today.getDate() + 7);
      return { label: "Next 7 Days", dateFrom: fmt(today), dateTo: fmt(end) };
    }
    return null;
  };

  // Live autocomplete from DB + static suggestions
  const fetchSuggestions = useCallback(async (partial: string) => {
    if (partial.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const results: Suggestion[] = [];
    const lower = partial.toLowerCase();

    // Check for temporal intent first
    const temporal = detectTemporalIntent(partial);

    // Build temporal events query if needed
    const temporalQuery = temporal
      ? supabase
          .from("events")
          .select("title, slug, date_start, venue_name, cities!inner(name)")
          .eq("status", "active")
          .lte("date_start", temporal.dateTo)
          .gte("date_start", temporal.dateFrom)
          .order("date_start", { ascending: true })
          .limit(8)
          .then(r => r)
      : Promise.resolve({ data: null });

    // Run all queries in parallel
    const [byName, byCity, byCat, eventRes, cityRes, catRes, temporalEventsRes] = await Promise.all([
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
      temporalQuery,
    ]);
    const temporalEvents = temporalEventsRes as any;

    // If temporal intent, show date-matched events FIRST
    if (temporal && temporalEvents?.data?.length) {
      // Add a header-style suggestion
      results.push({
        label: `Events ${temporal.label}`,
        type: "event",
        subtitle: `${temporalEvents.data.length} event${temporalEvents.data.length !== 1 ? 's' : ''} found`,
        link: `/search?q=events+${temporal.label.toLowerCase().replace(/\s+/g, "+")}`,
      });
      for (const e of temporalEvents.data) {
        const venueName = (e as any).venue_name || "";
        const cityName = ((e as any).cities as any)?.name || "";
        results.push({
          label: e.title,
          type: "event",
          subtitle: [venueName, cityName].filter(Boolean).join(" · "),
          link: `/event/${e.slug}`,
        });
      }
    }

    // If temporal intent found, skip listing results (user wants events)
    if (!temporal) {
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

      // Events by title match
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

  const doSearch = (suggestion?: Suggestion) => {
    if (suggestion?.link) {
      navigate(suggestion.link);
      setShowSuggestions(false);
      onClose?.();
      return;
    }
    const q = suggestion?.label || query;
    if (q.trim()) {
      const clean = q.replace(/\s–\s.+$/, "").trim();
      navigate(`/search?q=${encodeURIComponent(clean)}`);
      setShowSuggestions(false);
      onClose?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      doSearch(suggestions[selectedIndex]);
    } else {
      doSearch();
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
              onClick={() => doSearch(s)}
            >
              {getIcon(s.type)}
              <div className="flex-1 min-w-0">
                <span className="block truncate">{s.label}</span>
                {s.subtitle && (
                  <span className={`block text-[11px] truncate ${
                    i === selectedIndex ? "text-primary-foreground/60" : "text-muted-foreground/60"
                  }`}>
                    {s.subtitle}
                  </span>
                )}
              </div>
              {getTypeLabel(s.type) && (
                <span className={`text-[10px] uppercase tracking-wider shrink-0 ${
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
