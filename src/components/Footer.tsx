import { Link } from "react-router-dom";

const FOOTER_CITIES = [
  { name: "Belfast", slug: "belfast" },
  { name: "Derry", slug: "derry" },
  { name: "Lisburn", slug: "lisburn" },
  { name: "Newry", slug: "newry" },
  { name: "Bangor", slug: "bangor" },
  { name: "London", slug: "london" },
  { name: "Manchester", slug: "manchester" },
  { name: "Edinburgh", slug: "edinburgh" },
];

const FOOTER_CATEGORIES = [
  { name: "Events", to: "/events-belfast" },
  { name: "Things To Do", to: "/things-to-do-belfast" },
  { name: "Restaurants", to: "/best-restaurants-belfast" },
  { name: "Cafes", to: "/best-cafes-belfast" },
  { name: "Bars", to: "/bars-belfast" },
  { name: "Brunch", to: "/best-brunch-belfast" },
  { name: "Nightlife", to: "/nightlife-belfast" },
  { name: "Live Music", to: "/live-music-belfast" },
];

const FOOTER_QUICK_LINKS = [
  { name: "This Weekend", to: "/things-to-do-belfast-this-weekend" },
  { name: "Today", to: "/things-to-do-belfast-today" },
  { name: "Free Events", to: "/free-events-belfast" },
  { name: "Family Activities", to: "/family-activities-belfast" },
  { name: "Date Night", to: "/date-night-belfast" },
  { name: "Free Things To Do", to: "/free-things-to-do-belfast" },
];

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-10 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                <span className="font-display font-bold text-accent-foreground text-xs">BL</span>
              </div>
              <span className="font-display font-bold text-base text-foreground">BestLocal</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover events, things to do, restaurants and hidden gems across Belfast, Northern Ireland and the UK.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Cities</h4>
            <nav className="flex flex-col gap-1.5">
              {FOOTER_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  to={`/${city.slug}`}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Categories</h4>
            <nav className="flex flex-col gap-1.5">
              {FOOTER_CATEGORIES.map((cat) => (
                <Link
                  key={cat.to}
                  to={cat.to}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Quick Links</h4>
            <nav className="flex flex-col gap-1.5">
              {FOOTER_QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">About</h4>
            <nav className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Contact</span>
              <span className="text-sm text-muted-foreground">Privacy Policy</span>
              <span className="text-sm text-muted-foreground">Terms of Service</span>
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                Admin
              </Link>
            </nav>
          </div>
        </div>

        {/* SEO footer links */}
        <div className="border-t border-border mt-8 pt-6">
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
            {[
              "Best Restaurants Belfast",
              "What's On Belfast",
              "Things To Do Belfast",
              "Events Belfast This Weekend",
              "Free Things To Do Belfast",
              "Best Brunch Belfast",
              "Date Night Belfast",
              "Live Music Belfast",
              "Restaurants Cathedral Quarter",
              "Things To Do Titanic Quarter",
            ].map((text) => (
              <Link
                key={text}
                to={`/${text.toLowerCase().replace(/['']/g, "").replace(/\s+/g, "-")}`}
                className="text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                {text}
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BestLocal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
