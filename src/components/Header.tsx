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
      { label: "What's On Belfast", to: "/whats-on-belfast" },
      { label: "What's On NI", to: "/whats-on-northern-ireland" },
      { label: "Events This Weekend", to: "/events-this-weekend" },
      { label: "Free Events", to: "/free-events" },
      { label: "Family Events", to: "/family-events" },
      { label: "Live Music", to: "/live-music" },
      { label: "Theatre", to: "/theatre" },
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
      { label: "Halal Food", to: "/halal-food" },
      { label: "Alcohol Free", to: "/alcohol-free" },
    ],
  },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src={logo} alt="City Scout Guide" className="h-10 w-auto" />
          </Link>

          {/* Centre nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="flex items-center gap-1 px-3 py-2 text-sm text-foreground/70 hover:text-foreground transition-colors rounded-md font-medium">
                  {item.label}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
                {openDropdown === item.label && (
                  <div className="absolute top-full left-0 bg-card border border-border rounded-xl py-2 min-w-[220px] z-50 card-shadow-hover animate-fade-in">
                    {item.links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-secondary/60 transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link to="/cities" className="px-3 py-2 text-sm text-foreground/70 hover:text-foreground transition-colors rounded-md font-medium">
              Cities
            </Link>
            <Link to="/blog" className="px-3 py-2 text-sm text-foreground/70 hover:text-foreground transition-colors rounded-md font-medium">
              Blog
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-foreground/60 hover:text-foreground h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Link to="/submit-venue" className="hidden md:inline-flex">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold rounded-lg">
                List Your Venue
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground/60 h-9 w-9"
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
          <div className="lg:hidden pb-4 animate-fade-in border-t border-border pt-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  <span className="block px-2 py-2 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">
                    {item.label}
                  </span>
                  {item.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
              <Link to="/cities" className="px-2 py-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Cities</Link>
              <Link to="/blog" className="px-2 py-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
              <Link to="/submit-venue" className="px-2 py-2.5 text-sm font-semibold text-accent hover:text-accent/80 transition-colors" onClick={() => setMobileMenuOpen(false)}>List Your Venue</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
