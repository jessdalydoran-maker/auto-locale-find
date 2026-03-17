/**
 * Shared category filtering configuration.
 * Maps each category intent to strict inclusion/exclusion rules
 * so that discovery pages and search results only show relevant listings.
 *
 * Usage: getCategoryFilter("family-activities") →
 *   { includeSlugs: [...], audienceTags: [...], excludeSlugs: [...] }
 */

export interface CategoryFilter {
  /** Category slugs to include in the query */
  includeSlugs: string[];
  /** Audience tags to match (OR logic — any match counts) */
  audienceTags: string[];
  /** Category slugs to hard-exclude from results */
  excludeSlugs: string[];
  /** If true, this is a broad "everything" intent (things-to-do) */
  isBroadIntent: boolean;
}

/**
 * Strict per-category filter definitions.
 * Each key is a category slug that can appear in URLs or intent parsing.
 */
const CATEGORY_FILTERS: Record<string, CategoryFilter> = {
  "family-activities": {
    includeSlugs: ["family-activities", "parks", "museums", "cinemas", "leisure-centres", "leisure-entertainment", "indoor-activities", "attractions"],
    audienceTags: ["family", "kids", "family_friendly", "toddlers", "young-kids", "older-children"],
    excludeSlugs: ["bars", "pubs", "cocktail-bars", "nightlife", "lgbtq"],
    isBroadIntent: false,
  },
  "restaurants": {
    includeSlugs: ["restaurants", "italian"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "bars": {
    includeSlugs: ["bars", "pubs", "cocktail-bars"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "pubs": {
    includeSlugs: ["pubs", "bars"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "live-music": {
    includeSlugs: ["live-music"],
    audienceTags: ["live-music", "gigs", "acoustic", "trad", "open-mic", "dj"],
    excludeSlugs: ["sports"],
    isBroadIntent: false,
  },
  "cafes": {
    includeSlugs: ["cafes", "coffee-shops", "brunch"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "brunch": {
    includeSlugs: ["brunch", "cafes"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "cocktail-bars": {
    includeSlugs: ["cocktail-bars", "bars"],
    audienceTags: ["cocktails", "speakeasy", "rooftop-bar", "mixology"],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "date-night": {
    includeSlugs: ["date-night", "restaurants", "cocktail-bars", "bars", "cinemas", "theatre", "escape-rooms"],
    audienceTags: ["romantic", "date-night", "couples"],
    excludeSlugs: ["family-activities", "gyms", "sports"],
    isBroadIntent: false,
  },
  "halal-food": {
    includeSlugs: ["halal-food", "restaurants"],
    audienceTags: ["halal"],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "alcohol-free": {
    includeSlugs: ["alcohol-free", "cafes", "coffee-shops"],
    audienceTags: ["alcohol-free", "sober", "non-alcoholic"],
    excludeSlugs: ["bars", "pubs", "cocktail-bars", "nightlife"],
    isBroadIntent: false,
  },
  "nightlife": {
    includeSlugs: ["nightlife", "bars", "cocktail-bars", "live-music"],
    audienceTags: ["nightlife"],
    excludeSlugs: ["family-activities", "parks", "museums"],
    isBroadIntent: false,
  },
  "lgbtq": {
    includeSlugs: ["lgbtq", "bars", "nightlife"],
    audienceTags: ["lgbtq", "lgbt", "pride", "queer", "gay"],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "attractions": {
    includeSlugs: ["attractions", "museums", "tours", "parks", "things-to-do"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "cinemas": {
    includeSlugs: ["cinemas"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "theatre": {
    includeSlugs: ["theatre"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "parks": {
    includeSlugs: ["parks"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "museums": {
    includeSlugs: ["museums", "exhibitions"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "gyms": {
    includeSlugs: ["gyms"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "escape-rooms": {
    includeSlugs: ["escape-rooms"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "shopping": {
    includeSlugs: ["shopping"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "markets": {
    includeSlugs: ["markets"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "tours": {
    includeSlugs: ["tours"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "hidden-gems": {
    includeSlugs: ["hidden-gems"],
    audienceTags: ["hidden-gem"],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "indoor-activities": {
    includeSlugs: ["indoor-activities", "escape-rooms", "museums", "gyms", "cinemas", "leisure-centres", "leisure-entertainment"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "leisure-centres": {
    includeSlugs: ["leisure-centres"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "leisure-entertainment": {
    includeSlugs: ["leisure-entertainment", "leisure-centres"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "comedy": {
    includeSlugs: ["comedy"],
    audienceTags: ["comedy"],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "sports": {
    includeSlugs: ["sports"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "accommodation": {
    includeSlugs: ["accommodation", "hotels", "b-and-bs"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "hotels": {
    includeSlugs: ["hotels"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  },
  "events": {
    includeSlugs: ["events"],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: true,
  },
  // "things-to-do" is the broadest intent — include everything
  "things-to-do": {
    includeSlugs: [
      "things-to-do", "attractions", "cinemas", "theatre", "leisure-centres",
      "parks", "restaurants", "bars", "live-music", "family-activities",
      "shopping", "leisure-entertainment", "museums", "escape-rooms",
      "tours", "markets", "cafes", "comedy", "indoor-activities",
    ],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: true,
  },
};

/**
 * Get the category filter for a given slug.
 * Falls back to a simple single-slug filter if no config exists.
 */
export function getCategoryFilter(slug: string): CategoryFilter {
  if (CATEGORY_FILTERS[slug]) return CATEGORY_FILTERS[slug];

  // Fallback: treat as a simple single-category filter
  return {
    includeSlugs: [slug],
    audienceTags: [],
    excludeSlugs: [],
    isBroadIntent: false,
  };
}

/**
 * Resolve the primary category filter from intent category slugs.
 * Uses the FIRST non-"things-to-do" slug if available, else "things-to-do".
 */
export function resolveIntentFilter(categorySlugs: string[]): CategoryFilter {
  if (categorySlugs.length === 0) return getCategoryFilter("things-to-do");

  // Prefer the most specific (non-broad) slug
  const specific = categorySlugs.find(s => CATEGORY_FILTERS[s] && !CATEGORY_FILTERS[s].isBroadIntent);
  if (specific) return getCategoryFilter(specific);

  return getCategoryFilter(categorySlugs[0]);
}

/**
 * Check if a listing should be excluded based on the category filter.
 */
export function shouldExcludeListing(
  listing: { categories?: { slug: string } | null; audience_tags?: string[] | null },
  filter: CategoryFilter
): boolean {
  if (filter.excludeSlugs.length === 0) return false;
  const catSlug = (listing.categories as any)?.slug;
  return catSlug ? filter.excludeSlugs.includes(catSlug) : false;
}
