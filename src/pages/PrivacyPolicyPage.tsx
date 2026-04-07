import { Layout } from "@/components/Layout";
import { useEffect } from "react";
import { setPageCanonical } from "@/lib/canonical";

const PrivacyPolicyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy | City Scout Guide";
    setPageCanonical("/privacy-policy");
  }, []);

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="prose prose-lg mx-auto space-y-8">
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              City Scout Guide ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you visit our website at cityscoutguide.com.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We may collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Contact information:</strong> When you use our contact form or subscribe to our newsletter, we collect your name and email address.</li>
              <li><strong className="text-foreground">Usage data:</strong> We collect anonymous usage data such as pages visited, time spent on site, and referring URLs to improve our service.</li>
              <li><strong className="text-foreground">Venue submissions:</strong> If you submit a venue or suggest an event, we collect the information you provide in those forms.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To respond to your enquiries via the contact form</li>
              <li>To send you our newsletter if you have subscribed</li>
              <li>To improve our website and user experience</li>
              <li>To review and publish venue or event submissions</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Data Storage & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard encryption and access controls. We do not sell, trade, or otherwise share your personal information with third parties except as required by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to ensure our website functions correctly. We may also use analytics cookies to understand how visitors use our site. You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">Under data protection law, you have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing at any time</li>
              <li>Lodge a complaint with the Information Commissioner's Office (ICO)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to read their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please get in touch via our{" "}
              <a href="/contact" className="text-accent hover:underline font-medium">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
