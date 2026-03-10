import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-10 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                <span className="font-display font-bold text-accent-foreground text-xs">BL</span>
              </div>
              <span className="font-display font-bold text-base text-foreground">BestLocal</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover the best places in cities across the UK. Restaurants, cafes, bars, activities and more.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Popular Cities</h4>
            <nav className="flex flex-col gap-1.5">
              {["London", "Belfast", "Manchester", "Glasgow", "Edinburgh", "Liverpool"].map((city) => (
                <Link
                  key={city}
                  to={`/${city.toLowerCase()}`}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  {city}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Categories</h4>
            <nav className="flex flex-col gap-1.5">
              {["Restaurants", "Cafes", "Bars", "Things To Do", "Gyms"].map((cat) => (
                <Link
                  key={cat}
                  to={`/categories`}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  {cat}
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
            </nav>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BestLocal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
