import { Layout } from "@/components/Layout";
import { Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { setPageCanonical } from "@/lib/canonical";

const SuggestEventPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thank you! We'll review your event suggestion.");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6 text-teal" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Suggest an Event</h1>
          <p className="text-muted-foreground text-sm">Know about an upcoming event in Northern Ireland? Help the community discover it.</p>
        </div>

        {submitted ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center card-shadow">
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Event Suggestion Received!</h2>
            <p className="text-muted-foreground text-sm">We'll review your event and add it to the listings if it meets our criteria. Thanks for contributing!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 card-shadow space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Event Name *</label>
              <input required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Comber Farmers Market" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Venue / Location *</label>
              <input required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Comber Town Square" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Date *</label>
                <input required type="date" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Time</label>
                <input type="time" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Event Link</label>
              <input type="url" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="What's the event about?" />
            </div>
            <Button type="submit" className="w-full gap-2">
              <Send className="h-4 w-4" /> Suggest Event
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default SuggestEventPage;
