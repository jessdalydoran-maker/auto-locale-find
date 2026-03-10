/**
 * Search Intent Engine
 * Maps natural language queries to structured search intents
 */

// Intent → category slug mappings
const INTENT_TO_CATEGORIES: Record<string, string[]> = {
  "places to eat": ["restaurants", "cafes", "brunch", "bars"],
  "where to eat": ["restaurants", "cafes", "brunch"],
  "food": ["restaurants", "cafes", "brunch"],
  "food spots": ["restaurants", "cafes"],
  "eating out": ["restaurants", "cafes", "brunch"],
  "dining": ["restaurants"],
  "restaurant": ["restaurants"],
  "restaurants": ["restaurants"],
  "cafe": ["cafes"],
  "cafes": ["cafes"],
  "coffee": ["cafes"],
  "coffee shops": ["cafes"],
  "brunch": ["brunch"],
  "breakfast": ["brunch", "cafes"],
  "lunch": ["restaurants", "cafes", "brunch"],
  "dinner": ["restaurants"],
  "bar": ["bars"],
  "bars": ["bars"],
  "pubs": ["bars"],
  "pub": ["bars"],
  "cocktails": ["cocktail-bars", "bars"],
  "cocktail bars": ["cocktail-bars", "bars"],
  "drinks": ["bars", "cocktail-bars"],
  "nightlife": ["bars", "cocktail-bars", "nightlife"],
  "night out": ["bars", "nightlife", "events"],
  "going out": ["bars", "nightlife", "events"],
  "things to do": ["things-to-do", "attractions", "activities", "events"],
  "activities": ["activities", "things-to-do"],
  "attractions": ["attractions", "things-to-do"],
  "events": ["events"],
  "what's on": ["events"],
  "whats on": ["events"],
  "live music": ["live-music", "events"],
  "music": ["live-music", "events"],
  "comedy": ["comedy", "events"],
  "theatre": ["theatre", "events"],
  "theater": ["theatre", "events"],
  "family": ["family-activities", "things-to-do"],
  "family activities": ["family-activities", "things-to-do"],
  "family day out": ["family-activities", "attractions", "parks"],
  "kids": ["family-activities"],
  "kids activities": ["family-activities"],
  "date night": ["restaurants", "bars", "cocktail-bars"],
  "date": ["restaurants", "bars", "cocktail-bars"],
  "romantic": ["restaurants", "bars"],
  "gyms": ["gyms"],
  "gym": ["gyms"],
  "fitness": ["gyms"],
  "parks": ["parks"],
  "park": ["parks"],
  "museums": ["museums"],
  "museum": ["museums"],
  "tours": ["tours"],
  "tour": ["tours"],
  "markets": ["markets"],
  "market": ["markets"],
  "escape rooms": ["escape-rooms"],
  "escape room": ["escape-rooms"],
  "indoor": ["escape-rooms", "museums", "gyms"],
  "indoor activities": ["escape-rooms", "museums", "gyms"],
  "outdoor": ["parks", "tours", "attractions"],
  "outdoor activities": ["parks", "tours", "attractions"],
  "hidden gems": ["hidden-gems"],
  "free": ["things-to-do", "events", "parks"],
  "free things to do": ["things-to-do", "events", "parks"],
  "cheap": ["restaurants", "cafes", "bars"],
};

// Known locations (lowercase)
const KNOWN_LOCATIONS: { pattern: string; city: string; neighbourhood?: string }[] = [
  { pattern: "belfast", city: "belfast" },
  { pattern: "cathedral quarter", city: "belfast", neighbourhood: "cathedral-quarter" },
  { pattern: "titanic quarter", city: "belfast", neighbourhood: "titanic-quarter" },
  { pattern: "ormeau", city: "belfast", neighbourhood: "ormeau" },
  { pattern: "ormeau road", city: "belfast", neighbourhood: "ormeau" },
  { pattern: "ballyhackamore", city: "belfast", neighbourhood: "ballyhackamore" },
  { pattern: "botanic", city: "belfast", neighbourhood: "botanic" },
  { pattern: "lisburn road", city: "belfast", neighbourhood: "lisburn-road" },
  { pattern: "queens quarter", city: "belfast", neighbourhood: "queens-quarter" },
  { pattern: "queen's quarter", city: "belfast", neighbourhood: "queens-quarter" },
];

// Modifiers
const KNOWN_MODIFIERS = [
  "best", "top", "good", "great", "popular", "recommended",
  "cheap", "affordable", "budget",
  "romantic", "cosy", "cozy",
  "family", "family friendly", "kid friendly",
  "free",
  "indoor", "outdoor",
  "late night", "late",
  "vegan", "vegetarian",
  "dog friendly", "pet friendly",
  "new", "trending",
];

// Stop words to strip
const STOP_WORDS = new Set([
  "in", "the", "a", "an", "for", "to", "of", "and", "or", "with",
  "near", "around", "at", "on", "is", "are", "what", "where", "which",
  "find", "show", "me", "my", "i", "we", "looking", "search",
]);

export interface SearchIntent {
  originalQuery: string;
  categorySlugs: string[];
  city: string | null;
  neighbourhood: string | null;
  modifiers: string[];
  keywords: string[]; // remaining meaningful words
  suggestedPages: string[];
}

/**
 * Parse a natural language query into a structured search intent
 */
export function parseSearchIntent(rawQuery: string): SearchIntent {
  const query = rawQuery.toLowerCase().trim();

  // 1. Extract location
  let city: string | null = null;
  let neighbourhood: string | null = null;
  let queryWithoutLocation = query;

  // Sort locations by pattern length desc so longer matches win
  const sortedLocations = [...KNOWN_LOCATIONS].sort(
    (a, b) => b.pattern.length - a.pattern.length
  );

  for (const loc of sortedLocations) {
    if (query.includes(loc.pattern)) {
      city = loc.city;
      neighbourhood = loc.neighbourhood || null;
      queryWithoutLocation = queryWithoutLocation.replace(loc.pattern, " ").trim();
      break;
    }
  }

  // Default to Belfast
  if (!city) city = "belfast";

  // 2. Extract modifiers
  const modifiers: string[] = [];
  let queryWithoutModifiers = queryWithoutLocation;

  // Sort by length desc for multi-word modifiers
  const sortedModifiers = [...KNOWN_MODIFIERS].sort((a, b) => b.length - a.length);
  for (const mod of sortedModifiers) {
    if (queryWithoutModifiers.includes(mod)) {
      modifiers.push(mod);
      queryWithoutModifiers = queryWithoutModifiers.replace(mod, " ").trim();
    }
  }

  // 3. Match intents to categories
  const categorySlugs = new Set<string>();

  // Try matching intent phrases (longest first)
  const sortedIntents = Object.keys(INTENT_TO_CATEGORIES).sort(
    (a, b) => b.length - a.length
  );

  for (const intent of sortedIntents) {
    if (query.includes(intent)) {
      for (const cat of INTENT_TO_CATEGORIES[intent]) {
        categorySlugs.add(cat);
      }
    }
  }

  // Also try individual remaining words
  if (categorySlugs.size === 0) {
    const words = queryWithoutModifiers
      .split(/\s+/)
      .filter((w) => !STOP_WORDS.has(w) && w.length > 2);

    for (const word of words) {
      if (INTENT_TO_CATEGORIES[word]) {
        for (const cat of INTENT_TO_CATEGORIES[word]) {
          categorySlugs.add(cat);
        }
      }
    }
  }

  // 4. Remaining keywords for text search fallback
  const keywords = queryWithoutModifiers
    .split(/\s+/)
    .filter((w) => !STOP_WORDS.has(w) && w.length > 2);

  // 5. Generate suggested page slugs
  const suggestedPages: string[] = [];
  const cats = Array.from(categorySlugs);
  const modSlug = modifiers[0] || "";

  for (const cat of cats.slice(0, 4)) {
    if (modSlug && city) {
      suggestedPages.push(`${modSlug}-${cat}-${city}`);
    }
    if (city) {
      suggestedPages.push(`${cat}-${city}`);
    }
  }

  return {
    originalQuery: rawQuery,
    categorySlugs: cats,
    city,
    neighbourhood,
    modifiers,
    keywords,
    suggestedPages,
  };
}

/**
 * Build a Supabase-compatible search strategy from parsed intent
 */
export function buildSearchFilters(intent: SearchIntent) {
  return {
    categorySlugs: intent.categorySlugs,
    citySlug: intent.city,
    neighbourhoodSlug: intent.neighbourhood,
    textSearchTerms: intent.keywords,
    modifiers: intent.modifiers,
  };
}

/**
 * Autocomplete suggestions from known data
 */
const STATIC_SUGGESTIONS = [
  // Food & Drink
  "best restaurants Belfast",
  "best cafes Belfast",
  "best brunch Belfast",
  "bars Belfast",
  "cocktail bars Belfast",
  "cheap eats Belfast",
  "romantic restaurants Belfast",
  "vegan restaurants Belfast",
  // Things To Do
  "things to do Belfast",
  "things to do Belfast this weekend",
  "free things to do Belfast",
  "family activities Belfast",
  "date night Belfast",
  "indoor activities Belfast",
  // What's On
  "events Belfast",
  "events Belfast this weekend",
  "free events Belfast",
  "live music Belfast",
  // Neighbourhoods
  "restaurants Cathedral Quarter",
  "bars Cathedral Quarter",
  "things to do Titanic Quarter",
  "cafes Ormeau Road",
  "restaurants Ballyhackamore",
  // Other
  "gyms Belfast",
  "parks Belfast",
  "escape rooms Belfast",
  "museums Belfast",
  "hidden gems Belfast",
];

export function getAutocompleteSuggestions(partial: string): string[] {
  if (!partial || partial.length < 2) return [];
  const lower = partial.toLowerCase();
  return STATIC_SUGGESTIONS.filter((s) => s.toLowerCase().includes(lower)).slice(0, 8);
}
