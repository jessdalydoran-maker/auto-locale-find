/**
 * Live music detection engine for Northern Ireland.
 *
 * This module uses a strict "strong signal required" approach:
 * an event or venue only qualifies as live music if it has
 * an unambiguous music indicator. Generic words like "live",
 * "session", or "performance" alone are NOT sufficient.
 *
 * Sports events are hard-excluded even when they contain
 * incidental music words (e.g. "Belfast Giants live").
 */

// ─── Category slugs ────────────────────────────────────────

/** Category slugs that are inherently music-related */
export const MUSIC_CATEGORY_SLUGS = [
  "live-music", "music", "gigs", "concerts",
];

/** Venue category slugs that commonly host live music */
export const MUSIC_VENUE_CATEGORY_SLUGS = [
  "bars", "pubs", "nightlife", "restaurants", "hotels",
];

/** Venue categories that should NEVER appear in live music results */
const SPORTS_VENUE_CATEGORIES = [
  "sports", "leisure-centres", "gyms", "arenas",
];

// ─── Strong music indicators ───────────────────────────────
// At least ONE of these must appear for keyword-based classification.
// Ordered roughly by specificity.

const STRONG_MUSIC_INDICATORS = [
  // Explicit live music phrases
  "live music", "live band", "live act", "live gig",
  // Performance types
  "acoustic night", "acoustic set", "acoustic session", "acoustic",
  "trad session", "trad night", "trad music", "traditional music",
  "open mic", "open-mic", "open mike",
  "singer songwriter", "singer-songwriter",
  "cover band", "covers band", "covers night", "tribute act", "tribute band", "tribute",
  "band night", "gig night",
  "music night", "music session", "music evening",
  "jazz night", "jazz session", "jazz",
  "blues night", "blues session", "blues",
  "folk night", "folk session", "folk music",
  "cabaret", "variety night",
  "dj set", "dj night",
  "pub music", "bar music", "lounge music",
  "jam session", "jam night",
  // Recurring patterns
  "resident singer", "resident musician", "resident band",
  "residency", "weekly music", "music every",
  "live music every", "live entertainment",
  // Single strong words (only match as whole words via regex below)
  "gig", "gigs", "concert", "concerts",
  "singer", "songwriter", "band",
];

/** Regex for single-word strong indicators that need word boundaries */
const STRONG_SINGLE_WORD_RE = /\b(gig|gigs|concert|concerts|singer|songwriter|band|acoustic|cabaret|jazz|blues|folk)\b/i;

// ─── Hard exclusions ───────────────────────────────────────
// If ANY of these appear, the item is excluded UNLESS
// a strong music indicator also exists (override check).

const HARD_EXCLUDE_TERMS = [
  // Sports
  "belfast giants", "ice hockey", "hockey match",
  "football", "rugby", "hurling", "gaelic",
  "soccer", "cricket", "boxing match", "wrestling",
  "athletics", "swimming gala",
  // Sport patterns
  "league game", "league match", "championship",
  "tournament", "match day", "matchday",
  "arena sports", "sports fixture",
  // Education / non-performance
  "music class", "music classes", "music course",
  "music lesson", "music lessons", "music theory",
  "instrument repair", "piano tuning",
  "recording studio", "tutorial",
];

const HARD_EXCLUDE_TAGS = [
  "sport", "sports", "football", "rugby", "hockey", "ice-hockey",
  "hurling", "gaelic", "soccer", "boxing", "wrestling",
  "league", "match", "game", "tournament", "championship",
  "training", "class", "classes", "workshop", "workshops",
  "lesson", "lessons", "course", "courses",
];

/**
 * Check if text has a strong OVERRIDE music signal that
 * should rescue it from exclusion. Must be very specific.
 */
function hasStrongMusicOverride(text: string): boolean {
  const overrides = [
    "live music", "live band", "acoustic night", "acoustic set",
    "trad session", "open mic", "jazz night", "blues night",
    "folk night", "cabaret", "dj set", "music night",
    "singer songwriter", "cover band", "tribute act",
    "gig night", "band night",
  ];
  return overrides.some(o => text.includes(o));
}

// ─── Tags ──────────────────────────────────────────────────

/** Tags on events that qualify as music */
export const MUSIC_EVENT_TAGS = [
  "live-music", "music", "concert", "gig", "band", "acoustic",
  "jazz", "folk", "trad", "open-mic", "singer-songwriter",
  "cabaret", "blues", "cover-band", "dj",
];

// ─── Recurring patterns ────────────────────────────────────

const RECURRING_MUSIC_PATTERNS = [
  /live music every\b/i,
  /trad sessions?\s*(every|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /acoustic (night|set|session)\s*(every|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?/i,
  /music (every|each)\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week)/i,
  /open mic (every|each)/i,
  /weekly (live music|gig|session|acoustic|trad|jazz|blues|folk)/i,
  /regular (live music|gig|session|acoustic|trad|jazz)/i,
  /resident (singer|musician|band|dj)\b/i,
  /(live music|acoustic|trad|jazz|blues|folk|open mic)\s*(night|evening)\s*(every|each)/i,
  /every\s*(friday|saturday|sunday|weekend|week)\s*(live music|acoustic|trad|gig|session|open mic)/i,
];

// ─── Public API ────────────────────────────────────────────

/**
 * Check whether an event qualifies as live music.
 *
 * Logic:
 * 1. Hard-exclude sports/education — unless strong music override
 * 2. Direct music category → accept
 * 3. Music tag → accept
 * 4. Recurring music pattern → accept
 * 5. Strong indicator in title → accept
 * 6. Strong indicator in description + title hint → accept
 * 7. Otherwise → reject
 */
export function isLiveMusicEvent(event: {
  title: string;
  tags?: string[] | null;
  short_description?: string | null;
  description?: string | null;
  categorySlug?: string;
  venue_name?: string | null;
}): boolean {
  const catSlug = event.categorySlug || "";
  const tags = (event.tags || []).map(t => t.toLowerCase());
  const title = event.title.toLowerCase();
  const desc = ((event.short_description || "") + " " + (event.description || "")).toLowerCase();
  const venue = (event.venue_name || "").toLowerCase();
  const combined = title + " " + desc + " " + venue;

  // 1. Hard exclude — with override escape hatch
  const hasExcludeTag = tags.some(t => HARD_EXCLUDE_TAGS.includes(t));
  const hasExcludeTerm = HARD_EXCLUDE_TERMS.some(t => combined.includes(t));
  
  if (hasExcludeTag || hasExcludeTerm) {
    // Only allow through if title has an unambiguous music signal
    if (!hasStrongMusicOverride(title)) return false;
  }

  // Also exclude "vs" / "v" patterns (sport fixtures) unless music override
  if (/\b(vs\.?|versus)\b/i.test(title) && !hasStrongMusicOverride(title)) return false;

  // 2. Direct music category
  if (MUSIC_CATEGORY_SLUGS.includes(catSlug)) return true;

  // 3. Music tag
  if (tags.some(t => MUSIC_EVENT_TAGS.includes(t))) return true;

  // 4. Recurring music pattern
  if (RECURRING_MUSIC_PATTERNS.some(r => r.test(combined))) return true;

  // 5. Strong indicator in title
  const titleHasStrong = STRONG_MUSIC_INDICATORS.some(k => title.includes(k)) ||
    STRONG_SINGLE_WORD_RE.test(title);
  if (titleHasStrong) return true;

  // 6. Strong indicator in description — but title must also hint
  const descHasStrong = STRONG_MUSIC_INDICATORS.some(k => desc.includes(k)) ||
    STRONG_SINGLE_WORD_RE.test(desc);
  if (descHasStrong) {
    const titleHasHint = STRONG_SINGLE_WORD_RE.test(title) ||
      /\b(music|live|dj|performer|entertainment)\b/i.test(title);
    if (titleHasHint) return true;
  }

  return false;
}

/**
 * Check whether a venue/listing qualifies as a live music venue.
 *
 * Prioritises pubs, bars, hotels, small theatres, community venues
 * and arts centres. Excludes sports venues and generic attractions.
 */
export function isLiveMusicVenue(listing: {
  name: string;
  categorySlug?: string;
  audience_tags?: string[] | null;
  short_description?: string | null;
  description?: string | null;
  is_event_venue?: boolean;
}): boolean {
  const catSlug = listing.categorySlug || "";
  const tags = (listing.audience_tags || []).map(t => t.toLowerCase());
  const name = listing.name.toLowerCase();
  const desc = ((listing.short_description || "") + " " + (listing.description || "")).toLowerCase();

  // Hard exclude sports venues
  if (SPORTS_VENUE_CATEGORIES.includes(catSlug)) return false;
  if (tags.some(t => ["sport", "sports", "gym", "leisure-centre"].includes(t))) return false;

  // Direct live-music or nightlife category
  if (["live-music", "nightlife"].includes(catSlug)) return true;

  // Tagged as music venue
  if (tags.some(t => ["live-music", "music", "live music", "gigs", "acoustic", "trad"].includes(t))) return true;

  // Is an event venue in a relevant category (pub/bar/hotel/restaurant)
  if (listing.is_event_venue && MUSIC_VENUE_CATEGORY_SLUGS.includes(catSlug)) return true;

  // Strong venue signals in name or description
  const VENUE_SIGNALS = [
    "live music", "live band", "acoustic", "trad session", "open mic",
    "gig", "gigs", "music venue", "music night", "jazz",
    "folk session", "cabaret", "singer songwriter", "dj set",
    "music every", "weekly music", "live entertainment",
  ];
  if (VENUE_SIGNALS.some(s => name.includes(s) || desc.includes(s))) return true;

  // Recurring music patterns in description
  if (RECURRING_MUSIC_PATTERNS.some(r => r.test(desc))) return true;

  // Well-known NI live music pubs/bars (fallback for venues without tags)
  const KNOWN_MUSIC_VENUES = [
    "empire", "limelight", "front page", "sunflower", "voodoo",
    "filthy", "mandela", "lavery", "errigle", "harp bar",
    "duke of york", "dirty onion", "menagerie", "ulster hall",
    "waterfront", "oh yeah", "black box", "an droichead",
    "mchugh", "kelly's cellars", "madden's", "fibber magees",
    "the points", "roost", "pavilion", "american bar",
    "garrick bar", "thirsty goat", "bot", "hatfield",
    "peadar o'donnell", "sandino", "gweedore",
    "bennigan's", "kremlin", "bert's", "hudson",
    "mcsorley's", "aether", "the john hewitt",
    "common market", "the cloth ear", "the spaniard",
  ];
  if (KNOWN_MUSIC_VENUES.some(v => name.includes(v))) return true;

  return false;
}

/**
 * Score a venue for live music relevance (higher = more relevant).
 * Used for sorting results so pubs/bars rank above generic venues.
 */
export function liveMusicVenueScore(listing: {
  categorySlug?: string;
  audience_tags?: string[] | null;
  is_event_venue?: boolean;
  rating?: number | null;
}): number {
  const catSlug = listing.categorySlug || "";
  const tags = (listing.audience_tags || []).map(t => t.toLowerCase());
  let score = 0;

  // Category priority
  const CAT_SCORES: Record<string, number> = {
    "live-music": 100, "nightlife": 80,
    "pubs": 70, "bars": 70,
    "hotels": 40, "restaurants": 30,
    "theatre": 50, "arts-centres": 60,
  };
  score += CAT_SCORES[catSlug] || 0;

  // Music tags boost
  if (tags.includes("live-music") || tags.includes("music")) score += 50;
  if (tags.includes("acoustic") || tags.includes("trad")) score += 30;
  if (listing.is_event_venue) score += 20;

  // Rating boost
  score += (listing.rating || 0) * 5;

  return score;
}
