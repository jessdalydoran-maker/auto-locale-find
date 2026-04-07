import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { setPageCanonical } from "@/lib/canonical";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

const ContactPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "Contact Us | City Scout Guide";
    setPageCanonical("/contact");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { name: name.trim(), email: email.trim(), message: message.trim() },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      console.error("Contact form error:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
            Got a question, suggestion, or just want to say hello? We'd love to hear from you.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-xl">
        {sent ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <Send className="h-7 w-7 text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Message Sent!</h2>
            <p className="text-muted-foreground mb-6">
              Thanks for reaching out. We'll get back to you as soon as we can.
            </p>
            <Button variant="outline" onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); }}>
              Send Another Message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input id="email" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="How can we help?" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-2" /> Send Message</>}
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default ContactPage;
