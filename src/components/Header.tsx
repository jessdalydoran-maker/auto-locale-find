import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="font-display font-bold text-accent-foreground text-sm">BL</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">BestLocal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/cities" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cities
            </Link>
            <Link to="/categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-muted-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4 animate-fade-in">
            <SearchBar onClose={() => setSearchOpen(false)} />
          </div>
        )}

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in border-t border-border pt-4">
            <nav className="flex flex-col gap-3">
              <Link
                to="/cities"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cities
              </Link>
              <Link
                to="/categories"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
