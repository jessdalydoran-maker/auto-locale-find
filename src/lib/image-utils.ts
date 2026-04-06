/**
 * Image utilities for venue-specific photo matching,
 * keyword-aware category fallbacks, alt text generation, and WebP support.
 *
 * RULES:
 * - Only display an image if it is verified (image_status = 'verified')
 *   or from a trusted source (google_places, manual, official, website, unsplash).
 * - All other images use a context-aware category placeholder.
 * - It is better to show a relevant placeholder than the wrong venue.
 * - Fallback images rotate per-category to avoid repetition on the same page.
 */

// ─── Fallback image pools (multiple per category for rotation) ───

const FALLBACK_POOLS: Record<string, string[]> = {
  // Theatre / Stage / Performance / Arts
  "theatre": [
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Live Music / Concerts / Gigs / Festivals
  "live-music": [
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "festivals": [
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Restaurants / Dining / Food
  "restaurants": [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "brunch": [
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "cafes": [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "coffee-shops": [
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "italian": [
    "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Bars / Cocktails / Nightlife
  "bars": [
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "cocktail-bars": [
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "nightlife": [
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Family / Kids
  "family-activities": [
    "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1587654780760-d7e6e6752e09?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Museums / History / Heritage
  "museums": [
    "https://images.unsplash.com/photo-1565060299509-453c4f3bc905?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Tours
  "tours": [
    "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&h=500&fit=crop&fm=webp&q=80", // Belfast
    "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800&h=500&fit=crop&fm=webp&q=80", // Giant's Causeway
    "https://images.unsplash.com/photo-1564959130747-897a8e5c33c6?w=800&h=500&fit=crop&fm=webp&q=80", // NI coast
  ],

  // Parks / Outdoor / Beaches / Hiking
  "parks": [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Attractions / Landmarks / Castles
  "attractions": [
    "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800&h=500&fit=crop&fm=webp&q=80", // Giant's Causeway
    "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&h=500&fit=crop&fm=webp&q=80", // Belfast skyline
    "https://images.unsplash.com/photo-1564959130747-897a8e5c33c6?w=800&h=500&fit=crop&fm=webp&q=80", // NI coast
  ],
  "things-to-do": [
    "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Events (generic)
  "events": [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // LGBT+ strict fallback groups
  // A. Pride / LGBTQ+ events / parades / community festivals
  "pride-event": [
    "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1561913618-35b46e18e0a5?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1573896900897-1f8d56adb227?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  // B. LGBT+ nightlife venues
  "lgbtq-nightlife": [
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  // C. LGBT+ community organisations
  "lgbtq-community": [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  // D. Choirs / music groups
  "choir-music": [
    "https://images.unsplash.com/photo-1477233534935-f5e6fe7c1159?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  // E. Arts festivals / theatre / cabaret / drag
  "arts-performance": [
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  // Generic LGBT+ safe fallback (never tourism)
  "lgbtq": [
    "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&h=500&fit=crop&fm=webp&q=80",
  ],

  // Other categories
  "cinemas": [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "comedy": [
    "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "exhibitions": [
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "markets": [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "escape-rooms": [
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "sports": [
    "https://images.unsplash.com/photo-1461896836934-bd45ba1a603c?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "indoor-activities": [
    "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "gyms": [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "date-night": [
    "https://images.unsplash.com/photo-1529543544282-ea8407407d89?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "hidden-gems": [
    "https://images.unsplash.com/photo-1564959130747-897a8e5c33c6?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "shopping": [
    "https://images.unsplash.com/photo-1519567241046-7f570f348a04?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
  "leisure-entertainment": [
    "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=500&fit=crop&fm=webp&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop&fm=webp&q=80",
  ],
};

// ─── Keyword → category mapping for title/tag matching ───

const KEYWORD_CATEGORY_MAP: Array<{ keywords: string[]; category: string }> = [
  // Theatre & Performance — check first so "Beauty and the Beast" → theatre, not attractions
  {
    keywords: ["theatre", "theater", "musical", "pantomime", "panto", "stage", "play", "drama", "ballet", "opera", "performance", "jnr", "junior", "production"],
    category: "theatre",
  },
  // Comedy — before live-music so comedy events with "music" tag don't get mismatched
  {
    keywords: ["comedy", "stand-up", "standup", "comedian", "laugh", "improv", "comedy club"],
    category: "comedy",
  },
  // Sports / Fitness — before live-music so sports events with "music" tag don't get mismatched
  {
    keywords: ["marathon", "half marathon", "5k", "10k", "parkrun", "race week", "cycling", "sport", "gym", "fitness", "swimming", "boxing", "mma", "pfl", "fight", "v wilson", "v ", "rugby", "gaa", "hurling", "football"],
    category: "sports",
  },
  // Choir / vocal groups
  {
    keywords: ["choir", "choral", "vocal ensemble", "rehearsal"],
    category: "choir-music",
  },
  // Classical Music / Orchestra
  {
    keywords: ["orchestra", "symphony", "classical", "philharmonic", "recital", "violin", "pianist", "soprano", "tenor", "cello", "chamber music", "concerto", "andré rieu", "andre rieu", "strauss", "beethoven", "mozart", "chopin", "vivaldi", "operatic"],
    category: "live-music",
  },
  // Live Music / Gigs
  {
    keywords: ["gig", "concert", "band", "rock", "indie", "punk", "metal", "live music", "singer", "acoustic", "open mic", "open-mic", "songwriter", "musician", "performer", "vocalist", "soloist", "tribute"],
    category: "live-music",
  },
  // Trad / Folk
  {
    keywords: ["trad", "traditional", "irish music", "fiddle", "folk session", "céilí", "ceili", "folk"],
    category: "live-music",
  },
  // DJ / Club
  {
    keywords: ["dj", "club night", "dance", "techno", "electronic", "rave", "clubbing"],
    category: "nightlife",
  },
  // Festivals
  {
    keywords: ["festival", "carnival", "parade", "celebration", "fest"],
    category: "festivals",
  },
  // Food / Dining
  {
    keywords: ["restaurant", "dining", "food", "supper club", "tasting", "food market", "street food", "fine dining", "bistro", "brasserie"],
    category: "restaurants",
  },
  // Brunch
  {
    keywords: ["brunch", "breakfast", "bottomless"],
    category: "brunch",
  },
  // Café
  {
    keywords: ["cafe", "café", "coffee"],
    category: "cafes",
  },
  // Bars / Cocktails
  {
    keywords: ["bar", "cocktail", "speakeasy", "rooftop", "pub", "gin", "whiskey", "beer garden", "tap room"],
    category: "bars",
  },
  // Family / Kids
  {
    keywords: ["kids", "children", "family", "soft play", "farm", "aquarium", "zoo", "petting", "storytime", "toddler", "baby", "playground"],
    category: "family-activities",
  },
  // Museums / History
  {
    keywords: ["museum", "history", "heritage", "exhibition", "gallery", "artefact"],
    category: "museums",
  },
  // Tours
  {
    keywords: ["tour", "taxi tour", "walking tour", "bus tour", "boat tour", "guided"],
    category: "tours",
  },
  // Parks / Outdoor
  {
    keywords: ["park", "forest", "beach", "hiking", "walk", "trail", "nature", "garden", "outdoor", "mountain", "glen", "lough"],
    category: "parks",
  },
  // Attractions / Castles / Landmarks
  {
    keywords: ["castle", "landmark", "bridge", "causeway", "visitor", "heritage site", "ruins", "fort", "tower", "monument", "distillery", "caves"],
    category: "attractions",
  },
  // Cinema
  {
    keywords: ["cinema", "film", "movie", "screening", "imax"],
    category: "cinemas",
  },
  // Markets
  {
    keywords: ["market", "craft", "vintage", "flea", "antique"],
    category: "markets",
  },
  // Workshops
  {
    keywords: ["workshop", "class", "pottery", "yoga", "wellness", "craft workshop"],
    category: "indoor-activities",
  },
  // Quiz
  {
    keywords: ["quiz", "pub quiz", "trivia"],
    category: "bars",
  },
  // Shopping / Retail
  {
    keywords: ["shopping", "retail", "outlet", "mall", "shopping centre", "retail park"],
    category: "shopping",
  },
  // Leisure / Entertainment
  {
    keywords: ["bowling", "trampoline", "airtastic", "leisure", "soft play", "climbing wall", "arcade", "laser tag", "activity centre", "entertainment", "vertigo", "leisureplex"],
    category: "leisure-entertainment",
  },
  // (Sports moved above live-music for priority)
];

// ─── Rotation tracker (per page load, avoids same image on one page) ───

const _usedImages = new Set<string>();
let _resetTimer: ReturnType<typeof setTimeout> | null = null;

function resetUsedImages() {
  _usedImages.clear();
}

function pickFromPool(pool: string[]): string {
  // Schedule a reset after current render cycle
  if (!_resetTimer) {
    _resetTimer = setTimeout(() => {
      resetUsedImages();
      _resetTimer = null;
    }, 0);
  }

  // Try to find an unused image
  const unused = pool.filter((img) => !_usedImages.has(img));
  const candidates = unused.length > 0 ? unused : pool;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  _usedImages.add(pick);
  return pick;
}

// ─── Default NI placeholder ───

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&h=500&fit=crop&fm=webp&q=80"; // Belfast skyline

// ─── Trusted sources ───

const TRUSTED_SOURCES = new Set(["google_places", "manual", "official", "website", "unsplash"]);

const LGBT_ENTITY_PRIORITY_MAP: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["belfast lgbt choir", "lgbt choir"], category: "choir-music" },
  { keywords: ["belfast pride parade", "pride parade", "belfast pride festival", "pride festival", "belfast pride"], category: "pride-event" },
  { keywords: ["kremlin belfast", "maverick belfast", "union street bar belfast", "union street bar"], category: "lgbtq-nightlife" },
  { keywords: ["cara friend", "the rainbow project", "rainbow project", "here ni"], category: "lgbtq-community" },
  { keywords: ["outburst arts festival", "outburst"], category: "arts-performance" },
];

const LGBT_CONTEXT_KEYWORDS = [
  "lgbtq", "lgbt", "lgbt+", "lgbtq+", "pride", "queer", "drag", "cabaret",
  "rainbow project", "cara friend", "here ni", "kremlin", "maverick", "union street bar", "outburst", "belfast lgbt choir",
];

const LGBT_BLOCKED_CATEGORY_SLUGS = new Set(["attractions", "things-to-do", "tours", "parks", "hidden-gems"]);
const TOURISM_POOL_URLS = ["attractions", "things-to-do", "tours", "parks", "hidden-gems"]
  .flatMap((slug) => FALLBACK_POOLS[slug] ?? []);
const TOURISM_BLOCKED_URL_TOKENS = [
  "castle",
  "landmark",
  "causeway",
  "tourism",
  "scenic",
  "northern-ireland",
  "ni-coast",
  "photo-1590073844006-33379778ae09",
  "photo-1533154683836-84ea7a0bc310",
  "photo-1564959130747-897a8e5c33c6",
  "photo-1441974231531-c6227db76b6e",
  "photo-1501854140801-50d01698950b",
  "photo-1476231682828-37e571bc172f",
];

function buildSearchText(title?: string | null, tags?: string[] | null, description?: string | null): string {
  return [title, ...(tags || []), description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isLgbtContext(searchText: string, categorySlug?: string | null): boolean {
  if (categorySlug === "lgbtq") return true;
  if (!searchText) return false;
  return LGBT_CONTEXT_KEYWORDS.some((kw) => searchText.includes(kw));
}

function detectStrictLgbtCategory(searchText: string, categorySlug?: string | null): string | null {
  if (!isLgbtContext(searchText, categorySlug)) return null;

  for (const entry of LGBT_ENTITY_PRIORITY_MAP) {
    if (entry.keywords.some((kw) => searchText.includes(kw))) {
      return entry.category;
    }
  }

  if (["pride", "parade", "rainbow", "march", "community celebration"].some((kw) => searchText.includes(kw))) {
    return "pride-event";
  }

  if (["nightlife", "nightclub", "night club", "bar", "club", "cocktail", "dancefloor"].some((kw) => searchText.includes(kw))) {
    return "lgbtq-nightlife";
  }

  if (["choir", "choral", "vocal", "rehearsal", "singers", "live vocal"].some((kw) => searchText.includes(kw))) {
    return "choir-music";
  }

  if (["theatre", "theater", "cabaret", "drag", "stage", "performance", "arts"].some((kw) => searchText.includes(kw))) {
    return "arts-performance";
  }

  if (["support", "advocacy", "charity", "community", "wellbeing", "youth", "health"].some((kw) => searchText.includes(kw))) {
    return "lgbtq-community";
  }

  return "lgbtq-community";
}

function isTourismPlaceholderUrl(url: string): boolean {
  const normalized = url.split("?")[0];
  return TOURISM_POOL_URLS.some((img) => normalized.includes(img.split("?")[0]));
}

function isBlockedTourismImageUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  if (isTourismPlaceholderUrl(url)) return true;
  return TOURISM_BLOCKED_URL_TOKENS.some((token) => normalized.includes(token));
}

// ─── Public API ───

/**
 * Detect the best fallback category from title, tags, and description keywords.
 */
export function detectCategoryFromKeywords(
  title?: string | null,
  tags?: string[] | null,
  description?: string | null,
  categorySlug?: string | null
): string | null {
  const searchText = buildSearchText(title, tags, description);
  if (!searchText) return null;

  const strictLgbtCategory = detectStrictLgbtCategory(searchText, categorySlug);
  if (strictLgbtCategory) {
    return strictLgbtCategory;
  }

  for (const entry of KEYWORD_CATEGORY_MAP) {
    if (entry.keywords.some((kw) => searchText.includes(kw))) {
      return entry.category;
    }
  }

  if (isLgbtContext(searchText, categorySlug)) {
    return "lgbtq-community";
  }

  return null;
}

/**
 * Get a context-aware placeholder image.
 * Uses categorySlug first, then keyword detection from title/tags/description.
 * Rotates images from pools to prevent repetition on same page.
 */
export function getCategoryPlaceholder(
  categorySlug?: string | null,
  title?: string | null,
  tags?: string[] | null,
  description?: string | null
): string {
  const searchText = buildSearchText(title, tags, description);
  const lgbtContext = isLgbtContext(searchText, categorySlug);

  // 1. Try keyword-detected category first (more specific than slug)
  const keywordCategory = detectCategoryFromKeywords(title, tags, description, categorySlug);
  if (keywordCategory && FALLBACK_POOLS[keywordCategory]) {
    return pickFromPool(FALLBACK_POOLS[keywordCategory]);
  }

  // 2. Try the direct category slug (with LGBT tourism-guard)
  if (categorySlug && FALLBACK_POOLS[categorySlug]) {
    if (lgbtContext && LGBT_BLOCKED_CATEGORY_SLUGS.has(categorySlug)) {
      return pickFromPool(FALLBACK_POOLS["lgbtq-community"]);
    }
    return pickFromPool(FALLBACK_POOLS[categorySlug]);
  }

  // 3. LGBT context should never fall back to tourism/landmark imagery
  if (lgbtContext) {
    return pickFromPool(FALLBACK_POOLS["lgbtq-community"]);
  }

  // 4. Global fallback
  return DEFAULT_PLACEHOLDER;
}

/**
 * Get the image URL for a listing or event.
 * Only returns the venue-specific image if verified or from a trusted source.
 * Otherwise returns a context-aware category placeholder.
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  imageSource: string | null | undefined,
  categorySlug?: string | null,
  citySlug?: string | null,
  imageStatus?: string | null,
  title?: string | null,
  tags?: string[] | null,
  description?: string | null
): string {
  const searchText = buildSearchText(title, tags, description);
  const lgbtContext = isLgbtContext(searchText, categorySlug);

  // 1) Always prefer an available image URL, unless it's blocked in LGBT+ context
  if (imageUrl && imageUrl.trim().length > 0) {
    const candidate = ensureWebP(imageUrl);
    if (lgbtContext) {
      const normalizedSource = (imageSource || "").toLowerCase();
      if (normalizedSource === "fallback" || isBlockedTourismImageUrl(candidate)) {
        return getCategoryPlaceholder(categorySlug, title, tags, description);
      }
    }
    return candidate;
  }

  // 2) Fall back using strict context rules
  return getCategoryPlaceholder(categorySlug, title, tags, description);
}

/**
 * Build a robust onError handler that chains: category fallback → default placeholder.
 * Prevents infinite loops by tracking attempts on the element.
 */
export function buildImageErrorHandler(
  categorySlug?: string | null,
  title?: string | null,
  tags?: string[] | null,
  description?: string | null
): (e: React.SyntheticEvent<HTMLImageElement>) => void {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const attempt = parseInt(img.dataset.fallbackAttempt || "0", 10);
    const searchText = buildSearchText(title, tags, description);
    const lgbtContext = isLgbtContext(searchText, categorySlug);

    if (attempt === 0) {
      // First failure: try category-aware fallback
      img.dataset.fallbackAttempt = "1";
      img.src = getCategoryPlaceholder(categorySlug, title, tags, description);
    } else if (attempt === 1) {
      // Second failure: for LGBT+ keep safe context fallback only
      img.dataset.fallbackAttempt = "2";
      img.src = lgbtContext
        ? pickFromPool(FALLBACK_POOLS["lgbtq-community"])
        : DEFAULT_PLACEHOLDER;
    } else {
      // All fallbacks failed – hide the broken icon
      img.style.display = "none";
    }
  };
}

/**
 * Get a contextually relevant placeholder image for an event based on its title and tags.
 * Now uses the unified keyword detection + pool rotation system.
 */
export function getEventImageByKeywords(
  title: string,
  tags?: string[] | null
): string | null {
  const detectedCategory = detectCategoryFromKeywords(title, tags);
  if (detectedCategory && FALLBACK_POOLS[detectedCategory]) {
    return pickFromPool(FALLBACK_POOLS[detectedCategory]);
  }
  return null;
}

/**
 * Check if an image is a category placeholder (not venue-specific).
 */
export function isPlaceholderImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return true;
  const allPoolImages = Object.values(FALLBACK_POOLS).flat();
  return allPoolImages.some((p) => imageUrl.includes(p.split("?")[0])) || imageUrl === DEFAULT_PLACEHOLDER;
}

/**
 * Ensure Unsplash URLs use WebP format.
 */
function ensureWebP(url: string): string {
  if (!url) return DEFAULT_PLACEHOLDER;

  if (url.includes("unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("fm", "webp");
      u.searchParams.set("q", "80");
      if (!u.searchParams.has("w")) {
        u.searchParams.set("w", "600");
      }
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Generate SEO-optimised alt text for a listing image.
 */
export function generateListingAltText(
  venueName: string,
  categoryName?: string | null,
  neighbourhood?: string | null,
  cityName?: string | null,
  isPlaceholder?: boolean
): string {
  if (isPlaceholder) {
    const parts = [];
    if (categoryName) parts.push(categoryName);
    if (neighbourhood) parts.push(`in ${neighbourhood}`);
    if (cityName) parts.push(cityName);
    return parts.length > 0 ? parts.join(" — ") : "Venue image coming soon";
  }

  const parts = [venueName];
  if (categoryName) parts.push(categoryName.toLowerCase());
  if (neighbourhood) parts.push(`in ${neighbourhood}`);
  if (cityName && !neighbourhood) parts.push(`in ${cityName}`);
  else if (cityName && neighbourhood) parts.push(cityName);
  return parts.join(" — ");
}

/**
 * Generate SEO-optimised alt text for an event image.
 */
export function generateEventAltText(
  eventTitle: string,
  venueName?: string | null,
  cityName?: string | null,
  isPlaceholder?: boolean
): string {
  if (isPlaceholder) {
    const parts = ["Event"];
    if (cityName) parts.push(`in ${cityName}`);
    return parts.join(" ");
  }

  const parts = [eventTitle];
  if (venueName) parts.push(`at ${venueName}`);
  if (cityName) parts.push(`in ${cityName}`);
  return parts.join(" ");
}

/**
 * Generate alt text for a city image.
 */
export function generateCityAltText(cityName: string): string {
  return `${cityName} city skyline — things to do and places to visit`;
}

/**
 * Image source types for tracking provenance.
 */
export type ImageSource =
  | "google_places"
  | "manual"
  | "official"
  | "scrape"
  | "unsplash"
  | "fallback";

/**
 * Image verification statuses.
 */
export type ImageStatus =
  | "verified"
  | "needs_review"
  | "placeholder";
