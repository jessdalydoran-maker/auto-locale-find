import { RoamConcierge } from "@/components/RoamConcierge";
import { setPageCanonical } from "@/lib/canonical";
import { Link } from "react-router-dom";
import { useEffect } from "react";

/**
 * Standalone ROAM page.
 *
 * Intentionally does NOT use the CityScoutGuide <Layout> wrapper —
 * this page should feel like an embedded SaaS module, not another page
 * of the destination website.  A minimal back-link is provided instead.
 */
const RoamPage = () => {
  useEffect(() => {
    setPageCanonical("/roam");
    document.title = "ROAM Concierge";
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal top bar */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <Link to="/" className="text-[13px] text-muted-foreground/50 hover:text-foreground transition-colors">
          &larr; Back
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
          ROAM
        </p>
        <div className="w-10" /> {/* spacer for centering */}
      </header>

      {/* Widget, vertically centred on desktop, top-aligned on mobile */}
      <main className="flex-1 flex items-start md:items-center justify-center px-4 py-8 md:py-12">
        <RoamConcierge />
      </main>
    </div>
  );
};

export default RoamPage;
