import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

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
  { name: "Events", to: "/events" },
  { name: "Things To Do", to: "/things-to-do" },
  { name: "Restaurants", to: "/best-restaurants-belfast" },
  { name: "Cafes", to: "/best-cafes-belfast" },
  { name: "Bars", to: "/bars-belfast" },
  { name: "Brunch", to: "/best-brunch-belfast" },
  { name: "Nightlife", to: "/nightlife" },
  { name: "Live Music", to: "/live-music" },
];

const FOOTER_QUICK_LINKS = [
  { name: "This Weekend", to: "/things-to-do-this-weekend" },
  { name: "Today", to: "/things-to-do-today" },
  { name: "Free Events", to: "/free-events" },
  { name: "Family Activities", to: "/family-activities" },
  { name: "Date Night", to: "/date-night" },
  { name: "Free Things To Do", to: "/free-things-to-do" },
];

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="City Scout Guide" className="h-8 w-auto" />
              <span className="font-display font-bold text-[15px] text-foreground">City Scout Guide</span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Discover events, markets, restaurants, family activities and hidden gems across Northern Ireland.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-[13px] text-foreground mb-3">Cities</h4>
            <nav className="flex flex-col gap-1.5">
              {FOOTER_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  to={`/${city.slug}`}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-[13px] text-foreground mb-3">Categories</h4>
            <nav className="flex flex-col gap-1.5">
              {FOOTER_CATEGORIES.map((cat) => (
                <Link
                  key={cat.to}
                  to={cat.to}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-[13px] text-foreground mb-3">Quick Links</h4>
            <nav className="flex flex-col gap-1.5">
              {FOOTER_QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-[13px] text-foreground mb-3">Contribute</h4>
            <nav className="flex flex-col gap-1.5">
              <Link to="/submit-venue" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                Submit a Venue
              </Link>
              <Link to="/suggest-event" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                Suggest an Event
              </Link>
              <span className="text-[13px] text-muted-foreground">Contact</span>
              <span className="text-[13px] text-muted-foreground">Privacy Policy</span>
              <Link to="/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            </nav>
          </div>
        </div>

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
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {text}
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} City Scout Guide. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
