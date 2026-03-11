import { Layout } from "@/components/Layout";
import { MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const SubmitVenuePage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thank you! We'll review your submission shortly.");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-6 w-6 text-accent" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Submit a Venue</h1>
          <p className="text-muted-foreground text-sm">Know a great place that's missing from City Scout Guide? Let us know and we'll add it to the directory.</p>
        </div>

        {submitted ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center card-shadow">
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Submission Received!</h2>
            <p className="text-muted-foreground text-sm">We'll review your venue and add it to the directory if it meets our criteria. Thanks for helping grow the community.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 card-shadow space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Venue Name *</label>
              <input required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. The Dock Café" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Town / City *</label>
              <input required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Belfast" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Restaurant, Café, Market, Activity" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Website or Social Link</label>
              <input type="url" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Why should we feature this venue?</label>
              <textarea rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Tell us what makes it special..." />
            </div>
            <Button type="submit" className="w-full gap-2">
              <Send className="h-4 w-4" /> Submit Venue
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default SubmitVenuePage;
