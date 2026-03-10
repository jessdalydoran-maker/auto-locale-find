import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

interface SearchBarProps {
  onClose?: () => void;
  large?: boolean;
  placeholder?: string;
}

export const SearchBar = ({ onClose, large = false, placeholder = "Search by city, category or keyword..." }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 ${large ? 'h-[18px] w-[18px]' : 'h-4 w-4'}`} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow ${
          large 
            ? 'h-12 pl-11 pr-4 text-[15px] rounded-xl' 
            : 'h-10 pl-10 pr-3 text-[13px] rounded-lg'
        }`}
        autoFocus
      />
    </form>
  );
};
