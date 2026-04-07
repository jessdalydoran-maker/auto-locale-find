import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

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
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-primary text-primary-foreground mt-12">
      <div className="container mx-auto px-4 py-14">
        {/* Newsletter section */}
        <div className="text-center mb-12 pb-12 border-b border-primary-foreground/10">
          <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">Stay in the Loop</h3>
          <p className="text-primary-foreground/60 text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Get the best events, things to do and places to eat delivered to your inbox every week.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); }}
            className="flex gap-2 max-w-sm mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 bg-primary-foreground/10 border border-primary-foreground/15 rounded-lg text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center gap-1.5"
            >
              Subscribe <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <img src={logo} alt="City Scout Guide" className="h-10 w-auto brightness-0 invert opacity-80" />
            </div>
            <p className="text-sm text-primary-foreground/50 leading-relaxed">
              Discover events, restaurants, family activities and hidden gems across Northern Ireland.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-primary-foreground/80">Cities</h4>
            <nav className="flex flex-col gap-2">
              {FOOTER_CITIES.map((city) => (
                <Link key={city.slug} to={`/${city.slug}`} className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
                  {city.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-primary-foreground/80">Categories</h4>
            <nav className="flex flex-col gap-2">
              {FOOTER_CATEGORIES.map((cat) => (
                <Link key={cat.to} to={cat.to} className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-primary-foreground/80">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              {FOOTER_QUICK_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-primary-foreground/80">Contribute</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/submit-venue" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">Submit a Venue</Link>
              <Link to="/suggest-event" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">Suggest an Event</Link>
              <Link to="/about" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">About Us</Link>
              <Link to="/contact" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">Contact</Link>
              <Link to="/privacy-policy" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">Privacy Policy</Link>
              <Link to="/admin" className="text-sm text-primary-foreground/30 hover:text-primary-foreground/50 transition-colors">Admin</Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6">
          <p className="text-xs text-primary-foreground/30">© {new Date().getFullYear()} City Scout Guide. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
