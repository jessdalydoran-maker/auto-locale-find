import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Send,
  MapPin,
  Star,
  ArrowRight,
  Moon,
  Users,
  Heart,
  CloudRain,
  Sun,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { askRoamConcierge, type RoamResponse } from "@/lib/roam-retrieval";

const QUICK_PROMPTS = [
  { label: "Tonight", query: "What's on tonight nearby?", Icon: Moon },
  { label: "Family", query: "What's great for a family with kids today?", Icon: Users },
  { label: "Healthy food", query: "Where can I find healthy food nearby?", Icon: Heart },
  { label: "Rainy day", query: "What can we do on a rainy day?", Icon: CloudRain },
  { label: "Near the hotel", query: "What's worth visiting within walking distance?", Icon: MapPin },
  { label: "Plan my afternoon", query: "Plan a great afternoon for us nearby", Icon: Sun },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  text?: string;
  data?: RoamResponse;
  error?: boolean;
}

export const RoamConcierge = ({ compact = false }: { compact?: boolean }) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || isLoading) return;

    setQuery("");
    setIsLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await askRoamConcierge(trimmed);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        data: response,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        error: true,
        text: "I wasn't able to find recommendations right now. Please try browsing our curated guides below.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(query);
    }
  };

  const latestResponse = messages.filter((m) => m.role === "assistant").slice(-1)[0];
  const latestQuery = messages.filter((m) => m.role === "user").slice(-1)[0];
  const hasMessages = messages.length > 0;

  return (
    <div className={compact ? "" : "max-w-3xl mx-auto"}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <Compass className="h-5 w-5 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">
            ROAM
          </span>
        </div>
        <h2 className="font-display font-bold text-foreground">
          {compact ? "Ask Your Local Guide" : "Your Personal Local Guide"}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Curated recommendations from someone who knows the area
        </p>
      </div>

      {/* Input */}
      <div className={`relative ${compact ? "max-w-xl mx-auto" : ""} mb-5`}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What would you like to discover nearby?"
          disabled={isLoading}
          className="w-full px-5 py-3.5 pr-14 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all card-shadow disabled:opacity-60"
        />
        <Button
          size="icon"
          onClick={() => handleSubmit(query)}
          disabled={!query.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick prompts */}
      {!hasMessages && (
        <div className={`flex flex-wrap gap-2 justify-center ${compact ? "mb-4" : "mb-6"}`}>
          {QUICK_PROMPTS.slice(0, compact ? 4 : 6).map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => handleSubmit(prompt.query)}
              disabled={isLoading}
              className="group flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-foreground/70 hover:text-foreground hover:border-accent/30 hover:bg-accent/5 transition-all card-shadow disabled:opacity-50"
            >
              <prompt.Icon className="h-3.5 w-3.5 text-accent/60 group-hover:text-accent transition-colors" />
              {prompt.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4 animate-pulse" ref={responseRef}>
          <div className="h-5 bg-secondary rounded-lg w-3/4 mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-xl p-5 card-shadow">
                <div className="h-3 bg-secondary rounded w-1/3 mb-3" />
                <div className="h-4 bg-secondary rounded w-2/3 mb-3" />
                <div className="h-3 bg-secondary rounded w-full mb-2" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response */}
      {!isLoading && latestResponse && (
        <div ref={responseRef} className="animate-fade-in">
          {/* What was asked */}
          {latestQuery && (
            <p className="text-xs text-muted-foreground mb-4 text-center">
              <span className="font-medium">You asked:</span>{" "}
              <span className="italic">&ldquo;{latestQuery.text}&rdquo;</span>
            </p>
          )}

          {/* Error state */}
          {latestResponse.error && (
            <div className="bg-card rounded-xl p-6 card-shadow text-center">
              <p className="text-sm text-muted-foreground">{latestResponse.text}</p>
            </div>
          )}

          {/* AI / curated response */}
          {latestResponse.data && (
            <div className="space-y-5">
              {/* Lead recommendation */}
              <p className="font-display text-lg text-foreground text-center leading-relaxed px-4">
                {latestResponse.data.lead}
              </p>

              {/* Suggestion cards */}
              {latestResponse.data.suggestions.length > 0 && (
                <div
                  className={`grid gap-4 ${
                    latestResponse.data.suggestions.length === 1
                      ? "grid-cols-1 max-w-md mx-auto"
                      : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {latestResponse.data.suggestions
                    .slice(0, compact ? 3 : 4)
                    .map((s, i) => (
                      <SuggestionCard key={`${s.slug}-${i}`} suggestion={s} index={i} />
                    ))}
                </div>
              )}

              {/* Follow-up question */}
              {latestResponse.data.followUp && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => handleSubmit(latestResponse.data!.followUp)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary/60 hover:bg-secondary text-sm text-foreground/70 hover:text-foreground rounded-full transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    {latestResponse.data.followUp}
                  </button>
                </div>
              )}

              {/* Quick prompts for continued conversation */}
              {hasMessages && (
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => handleSubmit(prompt.query)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 rounded-full hover:border-accent/30 transition-all"
                    >
                      <prompt.Icon className="h-3 w-3" />
                      {prompt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Link to full ROAM page (compact mode) */}
              {compact && (
                <div className="text-center pt-2">
                  <Link
                    to="/roam"
                    className="text-sm text-accent font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    Continue in ROAM <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Suggestion card ── */

const SuggestionCard = ({
  suggestion: s,
  index,
}: {
  suggestion: RoamResponse["suggestions"][0];
  index: number;
}) => {
  const detailUrl = s.type === "event" ? `/event/${s.slug}` : `/place/${s.slug}`;

  return (
    <div
      className="group bg-card rounded-xl p-5 card-shadow hover:card-shadow-hover hover:scale-[1.01] transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top: category + name + rating */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          {s.category && (
            <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
              {s.category}
            </span>
          )}
          <Link
            to={detailUrl}
            className="block font-display font-semibold text-base text-foreground hover:text-accent transition-colors line-clamp-1"
          >
            {s.name}
          </Link>
        </div>
        {s.rating != null && s.rating > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="text-xs font-semibold text-foreground">{s.rating}</span>
            {s.reviewCount != null && s.reviewCount > 0 && (
              <span className="text-[11px] text-muted-foreground">({s.reviewCount})</span>
            )}
          </div>
        )}
      </div>

      {/* Reason */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
        {s.reason}
      </p>

      {/* Practical context */}
      {s.context && (
        <p className="text-xs text-muted-foreground/70 leading-relaxed mb-3">
          {s.context}
        </p>
      )}

      {/* Footer: address + view link */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {s.address ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
            <MapPin className="h-3 w-3 shrink-0 text-accent/60" />
            <span className="line-clamp-1">{s.address}</span>
          </div>
        ) : (
          <div />
        )}
        <Link
          to={detailUrl}
          className="text-[11px] text-accent font-semibold hover:underline flex items-center gap-0.5 shrink-0 ml-2"
          onClick={() => console.log(`ROAM click: ${s.type}/${s.slug}`)}
        >
          View <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>
    </div>
  );
};
