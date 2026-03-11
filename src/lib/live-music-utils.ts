/**
 * Shared live music detection logic.
 *
 * Live music in Northern Ireland isn't just concerts and festivals —
 * it's pub sessions, bar gigs, trad nights, acoustic sets, open mics,
 * cover bands, hotel lounge music and weekly residencies.
 * This module centralises the keyword/tag matching used across
 * search, homepage, and programmatic discovery pages.
 */

/** Category slugs that are inherently music-related */
export const MUSIC_CATEGORY_SLUGS = [
  "live-music", "music", "gigs", "concerts", "festivals",
];

/** Venue category slugs that commonly host live music */
export const MUSIC_VENUE_CATEGORY_SLUGS = [
  "bars", "pubs", "nightlife", "restaurants", "hotels",
];

/**
 * Keywords that signal live music intent in event titles,
 * descriptions, or tags. Covers the full NI pub/bar music spectrum.
 */
export const MUSIC_KEYWORDS = [
  "live music", "live band", "live act", "live performance",
  "acoustic", "acoustic night", "acoustic session", "acoustic set",
  "trad", "trad session", "trad night", "traditional music", "trad music",
  "open mic", "open mike", "open-mic",
  "singer", "songwriter", "singer-songwriter", "singer songwriter",
  "cover band", "covers band", "covers night", "tribute",
  "band night", "band", "gig", "gigs",
  "concert", "music night", "music session",
  "jazz", "jazz night", "jazz session",
  "cabaret", "variety night",
  "resident music", "residency", "weekly music",
  "folk", "folk night", "folk session", "folk music",
  "blues", "blues night",
  "pub music", "bar music", "lounge music",
  "jam session", "jam night",
  "session", "session night",
  "performance", "performer",
];

/** Terms that should EXCLUDE an event from live music results */
export const MUSIC_EXCLUDE_TERMS = [
  "class", "classes", "course", "courses",
  "workshop", "workshops", "lesson", "lessons",
  "recording", "tutorial", "music theory",
  "instrument repair", "piano tuning",
  // Sports exclusions
  "football", "rugby", "hockey", "ice hockey", "hurling", "gaelic",
  "soccer", "match day", "league game", "arena sports",
  "cricket", "boxing", "wrestling", "athletics",
  "sports fixture", "fixture", "vs ", " v ",
];

/** Tags that should exclude from live music */
export const MUSIC_EXCLUDE_TAGS = [
  "sport", "sports", "football", "rugby", "hockey", "ice-hockey",
  "hurling", "gaelic", "soccer", "match", "game", "league",
  "workshop", "workshops", "class", "classes",
];

/** Tags on events that qualify as music */
export const MUSIC_EVENT_TAGS = [
  "live-music", "music", "concert", "gig", "band", "acoustic",
  "jazz", "folk", "trad", "open-mic", "singer-songwriter",
  "cabaret", "blues", "cover-band", "session",
];

/**
 * Check whether an event qualifies as live music based on
 * its category, tags, title, and description.
 */
export function isLiveMusicEvent(event: {
  title: string;
  tags?: string[] | null;
  short_description?: string | null;
  description?: string | null;
  categorySlug?: string;
}): boolean {
  const catSlug = event.categorySlug || "";
  const tags = (event.tags || []).map(t => t.toLowerCase());
  const title = event.title.toLowerCase();
  const desc = ((event.short_description || "") + " " + (event.description || "")).toLowerCase();
  const combined = title + " " + desc;

  // Exclude non-performance content first
  if (MUSIC_EXCLUDE_TERMS.some(t => combined.includes(t))) return false;
  if (tags.includes("workshop") || tags.includes("workshops")) return false;

  // Direct category match
  if (MUSIC_CATEGORY_SLUGS.includes(catSlug)) return true;

  // Has a music-related tag
  if (tags.some(t => MUSIC_EVENT_TAGS.includes(t))) return true;

  // Title or description contains music keywords
  if (MUSIC_KEYWORDS.some(k => title.includes(k))) return true;
  if (MUSIC_KEYWORDS.some(k => desc.includes(k))) return true;

  return false;
}

/**
 * Check whether a venue/listing qualifies as a live music venue
 * based on its category, tags, name, and description.
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

  // Direct live-music or nightlife category
  if (["live-music", "nightlife"].includes(catSlug)) return true;

  // Tagged as music venue
  if (tags.includes("live-music") || tags.includes("music") || tags.includes("live music")) return true;

  // Is an event venue in a relevant category
  if (listing.is_event_venue && MUSIC_VENUE_CATEGORY_SLUGS.includes(catSlug)) return true;

  // Name or description signals
  const VENUE_SIGNALS = [
    "live music", "live band", "acoustic", "trad session", "open mic",
    "gig", "gigs", "music venue", "music night", "jazz",
    "folk", "session", "cabaret", "songwriters",
  ];

  if (VENUE_SIGNALS.some(s => name.includes(s) || desc.includes(s))) return true;

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
  ];

  if (KNOWN_MUSIC_VENUES.some(v => name.includes(v))) return true;

  return false;
}
