import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
              <span className="font-display font-bold text-accent-foreground text-xs">BL</span>
            </div>
            <span className="font-display font-bold text-base text-foreground">BestLocal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            <Link to="/cities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cities
            </Link>
            <Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-3 animate-fade-in">
            <SearchBar onClose={() => setSearchOpen(false)} />
          </div>
        )}

        {mobileMenuOpen && (
          <div className="md:hidden pb-3 animate-fade-in border-t border-border pt-3">
            <nav className="flex flex-col gap-2">
              <Link
                to="/cities"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cities
              </Link>
              <Link
                to="/categories"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Categories
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
