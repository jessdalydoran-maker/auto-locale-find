import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${large ? 'h-5 w-5' : 'h-4 w-4'}`} />
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`pl-10 bg-card border-border ${large ? 'h-14 text-base rounded-xl' : 'h-10 text-sm'}`}
        autoFocus
      />
    </form>
  );
};
