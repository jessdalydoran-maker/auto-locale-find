import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { getAutocompleteSuggestions } from "@/lib/search-intent";

interface SearchBarProps {
  onClose?: () => void;
  large?: boolean;
  placeholder?: string;
}

export const SearchBar = ({ onClose, large = false, placeholder = "Search by city, category or keyword..." }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions(getAutocompleteSuggestions(query));
    setSelectedIndex(-1);
    setShowSuggestions(query.length >= 2);
  }, [query]);

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
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setShowSuggestions(false);
      onClose?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      doSearch(suggestions[selectedIndex]);
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
              key={s}
              type="button"
              className={`w-full text-left px-3.5 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors ${
                i === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => doSearch(s)}
            >
              <Search className="h-3.5 w-3.5 shrink-0 opacity-40" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
