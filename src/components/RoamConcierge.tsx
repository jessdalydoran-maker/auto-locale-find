import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, MapPin, ArrowRight, Clock, Users, Leaf, CloudRain, Navigation, CalendarDays } from "lucide-react";
import { askRoamConcierge, type RoamResponse } from "@/lib/roam-retrieval";

const QUICK_PROMPTS = [
  { label: "Tonight", query: "What's on tonight nearby?" },
  { label: "Family", query: "What's great for a family with kids today?" },
  { label: "Healthy food", query: "Where can I find healthy food nearby?" },
  { label: "Rainy day", query: "What can we do on a rainy day?" },
  { label: "Near the hotel", query: "What's worth visiting within walking distance?" },
  { label: "Plan my afternoon", query: "Plan a great afternoon for us nearby" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  text?: string;
  data?: RoamResponse;
  error?: boolean;
}

/**
 * Tag icon helper — maps common context keywords to small inline icons.
 * Returns null if nothing matched; keeps the UI clean.
 */
function contextTags(s: RoamResponse["suggestions"][0]) {
  const tags: { icon: typeof MapPin; label: string }[] = [];
  const ctx = `${s.context ?? ""} ${s.reason ?? ""}`.toLowerCase();

  if (s.familyFriendly) tags.push({ icon: Users, label: "Family-friendly" });
  if (/indoor/.test(ctx)) tags.push({ icon: CloudRain, label: "Indoor" });
  if (/outdoor/.test(ctx)) tags.push({ icon: Navigation, label: "Outdoor" });
  if (/healthy|vegan|vegetarian/.test(ctx)) tags.push({ icon: Leaf, label: "Healthy option" });
  if (/walk|minute/.test(ctx)) tags.push({ icon: Clock, label: ctx.match(/\d+\s*min[a-z]*/)?.[0] || "Walking distance" });
  if (s.type === "event") tags.push({ icon: CalendarDays, label: "Event" });

  return tags.slice(0, 3);
}

export const RoamConcierge = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  /* ── Submit handler ── */
  const handleSubmit = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || isLoading) return;

    setQuery("");
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);

    try {
      const response = await askRoamConcierge(trimmed);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", data: response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          error: true,
          text: "I couldn't fetch recommendations just now. Please try again shortly.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(query);
    }
  };

  const latestResponse = messages.filter((m) => m.role === "assistant").at(-1);
  const latestQuery = messages.filter((m) => m.role === "user").at(-1);
  const hasResponse = !!latestResponse;

  /* ── Widget ── */
  return (
    <div className="roam-widget w-full max-w-[540px] mx-auto rounded-2xl border border-border/60 bg-card overflow-hidden" style={{ boxShadow: "0 2px 12px 0 hsl(210 40% 16% / 0.06)" }}>

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
          ROAM Concierge
        </p>
        <p className="text-[15px] text-foreground/80 leading-snug">
          Local recommendations, curated for your stay.
        </p>
      </div>

      {/* ── Quick prompts (shown before first query) ── */}
      {!hasResponse && !isLoading && (
        <div className="px-6 pb-4 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSubmit(p.query)}
              className="px-3 py-1.5 text-[13px] text-foreground/55 hover:text-foreground bg-background hover:bg-secondary/60 border border-border/40 hover:border-border rounded-full transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Input area ── */}
      <div className="px-6 pb-5">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about food, events, family activities..."
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3 bg-background border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSubmit(query)}
            disabled={!query.trim() || isLoading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg bg-foreground text-background hover:bg-foreground/85 transition-colors disabled:opacity-25 disabled:pointer-events-none"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="px-6 pb-6 space-y-3" ref={responseRef}>
          <div className="h-3 bg-secondary/60 rounded w-4/5 animate-pulse" />
          <div className="h-3 bg-secondary/40 rounded w-3/5 animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="h-3 bg-secondary/30 rounded w-2/5 animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      )}

      {/* ── Response ── */}
      {!isLoading && latestResponse && (
        <div ref={responseRef} className="animate-fade-in">
          {/* Divider */}
          <div className="mx-6 border-t border-border/40" />

          <div className="px-6 py-5 space-y-4">
            {/* Echo what was asked */}
            {latestQuery && (
              <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
                &ldquo;{latestQuery.text}&rdquo;
              </p>
            )}

            {/* Error */}
            {latestResponse.error && (
              <p className="text-sm text-muted-foreground">{latestResponse.text}</p>
            )}

            {/* Concierge answer */}
            {latestResponse.data && (
              <>
                {/* Lead */}
                <p className="text-[15px] text-foreground leading-relaxed">
                  {latestResponse.data.lead}
                </p>

                {/* Recommendations — vertical list, not grid */}
                {latestResponse.data.suggestions.length > 0 && (
                  <div className="space-y-2">
                    {latestResponse.data.suggestions.slice(0, 4).map((s, i) => (
                      <RecommendationRow key={`${s.slug}-${i}`} suggestion={s} />
                    ))}
                  </div>
                )}

                {/* Follow-up */}
                {latestResponse.data.followUp && (
                  <button
                    onClick={() => handleSubmit(latestResponse.data!.followUp)}
                    disabled={isLoading}
                    className="text-[13px] text-foreground/50 hover:text-foreground transition-colors text-left leading-relaxed"
                  >
                    &rarr; {latestResponse.data.followUp}
                  </button>
                )}

                {/* Quick prompts — smaller, for continued conversation */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_PROMPTS.slice(0, 4).map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handleSubmit(p.query)}
                      disabled={isLoading}
                      className="px-2.5 py-1 text-[12px] text-muted-foreground/50 hover:text-foreground border border-border/30 hover:border-border/60 rounded-full transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Recommendation row ── */

const RecommendationRow = ({ suggestion: s }: { suggestion: RoamResponse["suggestions"][0] }) => {
  const detailUrl = s.type === "event" ? `/event/${s.slug}` : `/place/${s.slug}`;
  const tags = contextTags(s);

  return (
    <Link
      to={detailUrl}
      onClick={() => console.log(`ROAM click: ${s.type}/${s.slug}`)}
      className="group block rounded-xl border border-border/30 hover:border-border/60 bg-background/50 hover:bg-background px-4 py-3.5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Name */}
          <p className="text-[14px] font-medium text-foreground group-hover:text-foreground/80 transition-colors leading-snug">
            {s.name}
          </p>
          {/* Reason */}
          <p className="text-[13px] text-muted-foreground/70 leading-relaxed mt-0.5">
            {s.reason}
          </p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors mt-1 shrink-0" />
      </div>

      {/* Tags row */}
      {(tags.length > 0 || s.address) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          {s.address && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{s.address}</span>
            </span>
          )}
          {tags.map((t, i) => (
            <span key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
              <t.icon className="h-3 w-3" />
              {t.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};
