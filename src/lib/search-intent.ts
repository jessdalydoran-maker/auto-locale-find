/**
 * Search Intent Engine
 * Maps natural language queries to structured search intents
 * with location-first priority for Northern Ireland directory searches.
 */

// Intent → category slug mappings
const INTENT_TO_CATEGORIES: Record<string, string[]> = {
  "places to eat": ["restaurants", "cafes", "brunch"],
  "where to eat": ["restaurants", "cafes", "brunch"],
  "best places to eat": ["restaurants", "cafes", "brunch"],
  "food": ["restaurants", "cafes", "brunch"],
  "food spots": ["restaurants", "cafes"],
  "eating out": ["restaurants", "cafes", "brunch"],
  "dining": ["restaurants"],
  "restaurant": ["restaurants"],
  "restaurants": ["restaurants"],
  "eat": ["restaurants", "cafes", "brunch"],
  "cafe": ["cafes"],
  "cafes": ["cafes"],
  "coffee": ["cafes", "coffee-shops"],
  "coffee shops": ["cafes", "coffee-shops"],
  "coffee shop": ["cafes", "coffee-shops"],
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
  "things to do": ["things-to-do", "attractions", "cinemas", "theatre", "leisure-centres", "parks", "restaurants", "bars", "live-music", "family-activities", "shopping", "leisure-entertainment", "museums", "tours", "escape-rooms"],
  "activities": ["things-to-do", "parks", "leisure-centres", "cinemas", "museums", "family-activities", "leisure-entertainment", "escape-rooms"],
  "attractions": ["attractions", "things-to-do", "museums", "parks", "family-activities", "tours"],
  "events": ["events"],
  "what's on": ["events"],
  "whats on": ["events"],
  "live music": ["live-music", "events", "bars"],
  "music": ["live-music", "events"],
  "acoustic": ["live-music", "events", "bars"],
  "trad": ["live-music", "events", "bars"],
  "trad session": ["live-music", "events", "bars"],
  "open mic": ["live-music", "events", "bars"],
  "gig": ["live-music", "events"],
  "gigs": ["live-music", "events"],
  "band": ["live-music", "events"],
  "singer": ["live-music", "events"],
  "songwriter": ["live-music", "events"],
  "jazz": ["live-music", "events", "bars"],
  "folk": ["live-music", "events"],
  "blues": ["live-music", "events"],
  "cabaret": ["live-music", "events"],
  "pub music": ["live-music", "bars"],
  "bar music": ["live-music", "bars"],
  "music tonight": ["live-music", "events"],
  "live music tonight": ["live-music", "events"],
  "live music this weekend": ["live-music", "events"],
  "live music tomorrow": ["live-music", "events"],
  "upcoming live music": ["live-music", "events"],
  "live music next week": ["live-music", "events"],
  "live music friday": ["live-music", "events"],
  "live music saturday": ["live-music", "events"],
  "comedy": ["comedy", "events", "things-to-do"],
  "family": ["family-activities", "things-to-do", "attractions", "parks"],
  "family activities": ["family-activities", "things-to-do", "attractions", "parks", "indoor-activities"],
  "family day out": ["family-activities", "attractions", "parks", "things-to-do"],
  "kids": ["family-activities", "indoor-activities", "parks"],
  "kids activities": ["family-activities", "indoor-activities", "leisure-entertainment"],
  "children": ["family-activities", "indoor-activities", "parks"],
  "toddler": ["family-activities"],
  "date night": ["restaurants", "bars", "cocktail-bars", "date-night", "cinemas", "theatre"],
  "date ideas": ["restaurants", "bars", "cocktail-bars", "date-night", "cinemas", "theatre"],
  "date": ["restaurants", "bars", "cocktail-bars", "date-night"],
  "romantic": ["restaurants", "bars", "cocktail-bars", "date-night"],
  "places to eat": ["restaurants", "cafes", "brunch"],
  "gyms": ["gyms"],
  "gym": ["gyms"],
  "fitness": ["gyms"],
  "parks": ["parks", "things-to-do"],
  "park": ["parks", "things-to-do"],
  "museums": ["museums", "things-to-do"],
  "museum": ["museums", "things-to-do"],
  "tours": ["tours", "things-to-do"],
  "tour": ["tours", "things-to-do"],
  "markets": ["markets", "events"],
  "market": ["markets", "events"],
  "escape rooms": ["escape-rooms", "things-to-do"],
  "escape room": ["escape-rooms", "things-to-do"],
  "indoor": ["escape-rooms", "museums", "gyms", "indoor-activities", "cinemas", "leisure-centres", "leisure-entertainment"],
  "indoor activities": ["escape-rooms", "museums", "gyms", "indoor-activities", "cinemas", "leisure-centres", "leisure-entertainment"],
  "outdoor": ["parks", "tours", "attractions", "things-to-do"],
  "outdoor activities": ["parks", "tours", "attractions", "things-to-do"],
  "cinema": ["cinemas", "things-to-do"],
  "cinemas": ["cinemas", "things-to-do"],
  "theatre": ["theatre", "events", "things-to-do"],
  "theater": ["theatre", "events", "things-to-do"],
  "hidden gems": ["hidden-gems"],
  "free": ["things-to-do", "events", "parks"],
  "free things to do": ["things-to-do", "events", "parks"],
  "cheap": ["restaurants", "cafes", "bars"],
  "lgbtq": ["lgbtq", "bars", "nightlife", "events"],
  "lgbtq+": ["lgbtq", "bars", "nightlife", "events"],
  "lgbt": ["lgbtq", "bars", "nightlife", "events"],
  "lgbt+": ["lgbtq", "bars", "nightlife", "events"],
  "lgbt bars": ["lgbtq", "bars", "nightlife"],
  "pride": ["lgbtq", "events"],
  "gay": ["lgbtq", "bars", "nightlife"],
  "gay bars": ["lgbtq", "bars", "nightlife"],
  "drag": ["lgbtq", "events"],
  "queer": ["lgbtq", "events", "bars"],
  "shopping": ["shopping", "things-to-do"],
  "movies": ["cinemas", "things-to-do"],
  "swimming": ["leisure-centres", "leisure-entertainment"],
  "leisure": ["leisure-centres", "leisure-entertainment", "things-to-do"],
  "leisure centre": ["leisure-centres"],
  "leisure centers": ["leisure-centres"],
  "recreation": ["leisure-centres"],
  "swimming pool": ["leisure-centres"],
  "halal": ["halal-food", "restaurants"],
  "halal food": ["halal-food", "restaurants"],
  "halal restaurants": ["halal-food", "restaurants"],
  "alcohol free": ["alcohol-free", "cafes"],
  "non alcoholic": ["alcohol-free", "cafes"],
  "sober": ["alcohol-free", "cafes", "things-to-do"],
  "dry bar": ["alcohol-free", "bars"],
  "opera": ["theatre", "events"],
  "musical": ["theatre", "events"],
  "play": ["theatre", "events"],
  "grand opera house": ["theatre", "events"],
  "lyric theatre": ["theatre", "events"],
  "what's on tonight": ["events"],
  "whats on tonight": ["events"],
  "what's on this weekend": ["events"],
  "whats on this weekend": ["events"],
};

// ─── Northern Ireland locations ───
// Each entry: pattern to match, city slug in DB, optional neighbourhood
const KNOWN_LOCATIONS: { pattern: string; city: string; neighbourhood?: string }[] = [
  // Belfast neighbourhoods (longest first)
  { pattern: "cathedral quarter", city: "belfast", neighbourhood: "cathedral-quarter" },
  { pattern: "titanic quarter", city: "belfast", neighbourhood: "titanic-quarter" },
  { pattern: "queen's quarter", city: "belfast", neighbourhood: "queens-quarter" },
  { pattern: "queens quarter", city: "belfast", neighbourhood: "queens-quarter" },
  { pattern: "lisburn road", city: "belfast", neighbourhood: "lisburn-road" },
  { pattern: "ormeau road", city: "belfast", neighbourhood: "ormeau" },
  { pattern: "ballyhackamore", city: "belfast", neighbourhood: "ballyhackamore" },
  { pattern: "stranmillis", city: "belfast", neighbourhood: "stranmillis" },
  { pattern: "botanic", city: "belfast", neighbourhood: "botanic" },
  { pattern: "ormeau", city: "belfast", neighbourhood: "ormeau" },
  // NI towns & cities
  { pattern: "belfast", city: "belfast" },
  { pattern: "lisburn", city: "lisburn" },
  { pattern: "bangor", city: "bangor" },
  { pattern: "newry", city: "newry" },
  { pattern: "armagh", city: "armagh" },
  { pattern: "derry", city: "derry" },
  { pattern: "londonderry", city: "derry" },
  { pattern: "omagh", city: "omagh" },
  { pattern: "strabane", city: "strabane" },
  { pattern: "ballymena", city: "ballymena" },
  { pattern: "coleraine", city: "coleraine" },
  { pattern: "portrush", city: "portrush" },
  { pattern: "portstewart", city: "portstewart" },
  { pattern: "enniskillen", city: "enniskillen" },
  { pattern: "antrim", city: "antrim" },
  { pattern: "carrickfergus", city: "carrickfergus" },
  { pattern: "larne", city: "larne" },
  { pattern: "newtownabbey", city: "newtownabbey" },
  { pattern: "newtownards", city: "newtownards" },
  { pattern: "downpatrick", city: "downpatrick" },
  { pattern: "dungannon", city: "dungannon" },
  { pattern: "cookstown", city: "cookstown" },
  { pattern: "magherafelt", city: "magherafelt" },
  { pattern: "limavady", city: "limavady" },
  { pattern: "ballycastle", city: "ballycastle" },
  { pattern: "holywood", city: "holywood" },
  { pattern: "comber", city: "comber" },
  { pattern: "hillsborough", city: "hillsborough" },
  { pattern: "dromore", city: "dromore" },
  { pattern: "craigavon", city: "craigavon" },
  { pattern: "portadown", city: "portadown" },
  { pattern: "lurgan", city: "lurgan" },
  { pattern: "warrenpoint", city: "warrenpoint" },
  { pattern: "newcastle", city: "newcastle" },
  { pattern: "ballynahinch", city: "ballynahinch" },
  { pattern: "randalstown", city: "randalstown" },
  { pattern: "templepatrick", city: "templepatrick" },
  { pattern: "dungiven", city: "dungiven" },
  { pattern: "ballyclare", city: "ballyclare" },
  { pattern: "clogher", city: "clogher" },
  { pattern: "northern ireland", city: "__region_ni" },
];

// Words to strip from query that indicate "town centre" intent but aren't searchable
const LOCATION_NOISE_WORDS = new Set(["town", "city", "centre", "center", "area", "village"]);

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
  "town", "city", "centre", "center", "area",
]);

// Query fillers to ignore when extracting intent keywords
const FILLER_WORDS = new Set([
  "things", "to", "do", "in", "near", "around", "what's", "whats", "on",
]);

const STRICT_TOWN_INTENT_PHRASES = ["things to do", "events", "live music", "restaurants"];

export interface SearchIntent {
  originalQuery: string;
  categorySlugs: string[];
  /** The resolved city slug, or null if no location detected */
  city: string | null;
  /** Whether the user explicitly mentioned a location */
  hasExplicitLocation: boolean;
  /** Whether this is a region-wide search (e.g. "Northern Ireland") */
  isRegionSearch: boolean;
  neighbourhood: string | null;
  modifiers: string[];
  keywords: string[]; // remaining meaningful words
  suggestedPages: string[];
  intentLabel: string | null;
  strictTownMode: boolean;
}

/**
 * Parse a natural language query into a structured search intent
 */
export function parseSearchIntent(rawQuery: string): SearchIntent {
  const query = rawQuery.toLowerCase().trim();

  // 1. Extract location
  let city: string | null = null;
  let neighbourhood: string | null = null;
  let hasExplicitLocation = false;
  let isRegionSearch = false;
  let queryWithoutLocation = query;

  // Sort locations by pattern length desc so longer matches win
  const sortedLocations = [...KNOWN_LOCATIONS].sort(
    (a, b) => b.pattern.length - a.pattern.length
  );

  for (const loc of sortedLocations) {
    if (query.includes(loc.pattern)) {
      hasExplicitLocation = true;
      if (loc.city === "__region_ni") {
        isRegionSearch = true;
        city = null;
      } else {
        city = loc.city;
        neighbourhood = loc.neighbourhood || null;
      }
      queryWithoutLocation = queryWithoutLocation.replace(loc.pattern, " ").trim();
      break;
    }
  }

  // Strip location noise words
  queryWithoutLocation = queryWithoutLocation
    .split(/\s+/)
    .filter((w) => !LOCATION_NOISE_WORDS.has(w))
    .join(" ")
    .trim();

  // 2. Extract modifiers
  const modifiers: string[] = [];
  let queryWithoutModifiers = queryWithoutLocation;

  const sortedModifiers = [...KNOWN_MODIFIERS].sort((a, b) => b.length - a.length);
  for (const mod of sortedModifiers) {
    if (queryWithoutModifiers.includes(mod)) {
      modifiers.push(mod);
      queryWithoutModifiers = queryWithoutModifiers.replace(mod, " ").trim();
    }
  }

  // 3. Match intents to categories (prefer cleaned query, fallback to full query)
  const categorySlugs = new Set<string>();
  let intentLabel: string | null = null;

  const sortedIntents = Object.keys(INTENT_TO_CATEGORIES).sort(
    (a, b) => b.length - a.length
  );

  for (const intent of sortedIntents) {
    if (queryWithoutLocation.includes(intent) || query.includes(intent)) {
      if (!intentLabel) intentLabel = intent;
      for (const cat of INTENT_TO_CATEGORIES[intent]) {
        categorySlugs.add(cat);
      }
    }
  }

  // Also try individual remaining words
  if (categorySlugs.size === 0) {
    const words = queryWithoutModifiers
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter((w) => !STOP_WORDS.has(w) && !FILLER_WORDS.has(w) && w.length > 2);

    for (const word of words) {
      if (INTENT_TO_CATEGORIES[word]) {
        if (!intentLabel) intentLabel = word;
        for (const cat of INTENT_TO_CATEGORIES[word]) {
          categorySlugs.add(cat);
        }
      }
    }
  }

  // 4. Remaining keywords for text search fallback
  const keywords = queryWithoutModifiers
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => !STOP_WORDS.has(w) && !FILLER_WORDS.has(w) && w.length > 2);

  // Dedicated strict town mode for explicit "[intent] in [town]" style searches
  const strictTownMode = Boolean(
    hasExplicitLocation &&
    city &&
    STRICT_TOWN_INTENT_PHRASES.some((phrase) =>
      query.includes(phrase) || queryWithoutLocation.includes(phrase)
    )
  );

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
    hasExplicitLocation,
    isRegionSearch,
    neighbourhood,
    modifiers,
    keywords,
    suggestedPages,
    intentLabel,
    strictTownMode,
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
  "best restaurants Belfast",
  "best cafes Belfast",
  "best brunch Belfast",
  "bars Belfast",
  "cocktail bars Belfast",
  "cheap eats Belfast",
  "romantic restaurants Belfast",
  "vegan restaurants Belfast",
  "things to do Belfast",
  "things to do Belfast this weekend",
  "free things to do Belfast",
  "family activities Belfast",
  "date night Belfast",
  "indoor activities Belfast",
  "events Belfast",
  "events Belfast this weekend",
  "free events Belfast",
  "live music Belfast",
  "restaurants Cathedral Quarter",
  "bars Cathedral Quarter",
  "things to do Titanic Quarter",
  "cafes Ormeau Road",
  "restaurants Ballyhackamore",
  "gyms Belfast",
  "parks Belfast",
  "escape rooms Belfast",
  "museums Belfast",
  "hidden gems Belfast",
  "things to do Antrim",
  "things to do Omagh",
  "restaurants Derry",
  "things to do Bangor",
  "things to do Newry",
  "live music Derry",
  "markets Belfast",
  "things to do Ballymena",
  "things to do Cookstown",
  "things to do Magherafelt",
  "things to do Dungiven",
  "things to do Enniskillen",
  "things to do Coleraine",
  "things to do Dungannon",
  "things to do Strabane",
  "things to do Lisburn",
  "things to do Craigavon",
  "things to do Downpatrick",
  "restaurants Ballymena",
  "restaurants Newry",
  "live music Ballymena",
  "events Ballymena",
  "events Cookstown",
];

export function getAutocompleteSuggestions(partial: string): string[] {
  if (!partial || partial.length < 2) return [];
  const lower = partial.toLowerCase();
  return STATIC_SUGGESTIONS.filter((s) => s.toLowerCase().includes(lower)).slice(0, 8);
}
