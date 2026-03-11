import { Link } from "react-router-dom";
import { Search, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";

const NAV_ITEMS = [
  {
    label: "What's On",
    links: [
      { label: "Events", to: "/events" },
      { label: "Events This Weekend", to: "/events-this-weekend" },
      { label: "Free Events", to: "/free-events" },
      { label: "Family Events", to: "/family-events" },
      { label: "Live Music", to: "/live-music" },
    ],
  },
  {
    label: "Things To Do",
    links: [
      { label: "Things To Do", to: "/things-to-do" },
      { label: "This Weekend", to: "/things-to-do-this-weekend" },
      { label: "Free Things To Do", to: "/free-things-to-do" },
      { label: "Family Activities", to: "/family-activities" },
      { label: "Date Night", to: "/date-night" },
    ],
  },
  {
    label: "Food & Drink",
    links: [
      { label: "Best Restaurants", to: "/best-restaurants-belfast" },
      { label: "Best Brunch", to: "/best-brunch-belfast" },
      { label: "Best Cafes", to: "/best-cafes-belfast" },
      { label: "Bars", to: "/bars-belfast" },
      { label: "Cocktail Bars", to: "/cocktail-bars-belfast" },
    ],
  },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <MapPin className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-[15px] text-foreground">City Scout Guide</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">Discover Northern Ireland</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="flex items-center gap-1 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors rounded-md">
                  {item.label}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
                {openDropdown === item.label && (
                  <div className="absolute top-full left-0 bg-card border border-border rounded-lg py-1.5 min-w-[200px] z-50 card-shadow-hover animate-fade-in">
                    {item.links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="block px-3.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link to="/cities" className="px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors rounded-md">
              Cities
            </Link>
            <Link to="/categories" className="px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors rounded-md">
              Categories
            </Link>
          </nav>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-muted-foreground hover:text-foreground h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-3 animate-fade-in">
            <SearchBar onClose={() => setSearchOpen(false)} placeholder="Search events, restaurants, things to do..." />
          </div>
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 animate-fade-in border-t border-border pt-3">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  <span className="block px-2 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {item.label}
                  </span>
                  {item.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="block px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
              <Link
                to="/cities"
                className="px-2 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cities
              </Link>
              <Link
                to="/categories"
                className="px-2 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
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
