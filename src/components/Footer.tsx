import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="font-display font-bold text-accent-foreground text-sm">BL</span>
              </div>
              <span className="font-display font-bold text-lg">BestLocal</span>
            </div>
            <p className="text-sm opacity-70">
              Discover the best places in cities across the UK. Restaurants, cafes, bars, activities and more.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Popular Cities</h4>
            <nav className="flex flex-col gap-2">
              {["London", "Belfast", "Manchester", "Glasgow", "Edinburgh", "Liverpool"].map((city) => (
                <Link
                  key={city}
                  to={`/${city.toLowerCase()}`}
                  className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  {city}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Categories</h4>
            <nav className="flex flex-col gap-2">
              {["Restaurants", "Cafes", "Bars", "Things To Do", "Gyms"].map((cat) => (
                <Link
                  key={cat}
                  to={`/categories`}
                  className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  {cat}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">About</h4>
            <nav className="flex flex-col gap-2">
              <span className="text-sm opacity-70">Contact</span>
              <span className="text-sm opacity-70">Privacy Policy</span>
              <span className="text-sm opacity-70">Terms of Service</span>
            </nav>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center">
          <p className="text-sm opacity-50">© {new Date().getFullYear()} BestLocal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
