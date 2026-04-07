import { Layout } from "@/components/Layout";
import { useEffect } from "react";
import { setPageCanonical } from "@/lib/canonical";

const AboutPage = () => {
  useEffect(() => {
    document.title = "About Us | City Scout Guide";
    setPageCanonical("/about");
  }, []);

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">About City Scout Guide</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
            Your trusted local guide to the best things to do, eat, and explore across Northern Ireland and beyond.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="prose prose-lg mx-auto space-y-8">
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              City Scout Guide was built to help locals and visitors discover the very best that cities and towns have to offer — from hidden-gem restaurants and buzzing bars to family-friendly activities and weekend events. We believe every place has a story, and we're here to help you find it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">What We Do</h2>
            <p className="text-muted-foreground leading-relaxed">
              We curate thousands of listings across Northern Ireland, covering restaurants, cafes, bars, nightlife, live music venues, events, family activities, and much more. Whether you're planning a date night in Belfast, a family day out in Derry, or looking for the best brunch spots in Bangor — we've got you covered.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Local First</h2>
            <p className="text-muted-foreground leading-relaxed">
              We're passionate about supporting local businesses and communities. Every listing on City Scout Guide is verified and curated with care. We work closely with venues, event organisers, and local communities to ensure our information is accurate, up-to-date, and genuinely helpful.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Get Involved</h2>
            <p className="text-muted-foreground leading-relaxed">
              Know a great venue we're missing? Got an event coming up? We'd love to hear from you. You can{" "}
              <a href="/submit-venue" className="text-accent hover:underline font-medium">submit a venue</a> or{" "}
              <a href="/suggest-event" className="text-accent hover:underline font-medium">suggest an event</a> at any time. Together, we can make sure no hidden gem goes unnoticed.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
