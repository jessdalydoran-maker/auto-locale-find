import { Layout } from "@/components/Layout";
import { RoamConcierge } from "@/components/RoamConcierge";
import { setPageCanonical } from "@/lib/canonical";
import { useEffect } from "react";

const RoamPage = () => {
  useEffect(() => {
    setPageCanonical("/roam");
    document.title = "ROAM — Your Local Guide | City Scout Guide";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Ask ROAM for personalised local recommendations — restaurants, activities, events, and hidden gems near your hotel.",
      );
  }, []);

  return (
    <Layout>
      <section className="container mx-auto px-4 py-10 md:py-16">
        <RoamConcierge />
      </section>
    </Layout>
  );
};

export default RoamPage;
