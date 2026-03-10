/**
 * Programmatic SEO slug parsing and content generation.
 *
 * Supported URL patterns:
 *   /best-restaurants-belfast                        → modifier + category + city
 *   /cheap-cafes-cathedral-quarter-belfast            → modifier + category + neighbourhood + city
 *   /restaurants-belfast                              → category + city
 *   /things-to-do-belfast-this-weekend                → category + city + timeIntent
 *   /free-events-belfast-this-weekend                 → modifier + category + city + timeIntent
 *   /whats-on-belfast                                 → alias → events + city
 *   /restaurants-near-titanic-belfast                 → category + near landmark + city
 *   /live-music-belfast-tonight                       → category + city + timeIntent
 */

export interface ParsedSlug {
  modifierSlug: string | null;
  categorySlug: string;
  neighbourhoodSlug: string | null;
  citySlug: string;
  timeIntent: string | null;
  nearLandmark: string | null;
}

const KNOWN_MODIFIERS = [
  "best",
  "cheap",
  "romantic",
  "family",
  "late-night",
  "vegan",
  "dog-friendly",
  "outdoor",
  "free",
  "indoor",
  "date-night",
];

const KNOWN_TIME_INTENTS = [
  "this-weekend",
  "this-week",
  "tonight",
  "today",
];

const CATEGORY_ALIASES: Record<string, string> = {
  "whats-on": "events",
  "what-to-do": "things-to-do",
};

/**
 * Parse a programmatic SEO slug into its components.
 */
export function parseSlug(
  slug: string,
  knownCities: string[],
  knownNeighbourhoods: { slug: string; citySlug: string }[]
): ParsedSlug | null {
  if (!slug) return null;

  let remaining = slug;

  // 1. Extract time intent from end
  let timeIntent: string | null = null;
  for (const ti of KNOWN_TIME_INTENTS) {
    if (remaining.endsWith("-" + ti)) {
      timeIntent = ti;
      remaining = remaining.slice(0, -(ti.length + 1));
      break;
    }
  }

  // 2. Extract modifier from start
  let modifierSlug: string | null = null;
  // Sort longest-first so "date-night" matches before "date"
  const sortedMods = [...KNOWN_MODIFIERS].sort((a, b) => b.length - a.length);
  for (const mod of sortedMods) {
    if (remaining.startsWith(mod + "-")) {
      modifierSlug = mod;
      remaining = remaining.slice(mod.length + 1);
      break;
    }
  }

  // 3. Try to match city at the end
  let citySlug: string | null = null;
  const sortedCities = [...knownCities].sort((a, b) => b.length - a.length);
  for (const city of sortedCities) {
    if (remaining.endsWith("-" + city) || remaining === city) {
      citySlug = city;
      remaining =
        remaining === city ? "" : remaining.slice(0, -(city.length + 1));
      break;
    }
  }

  if (!citySlug) return null;

  // 4. Check for "near-[landmark]" pattern
  let nearLandmark: string | null = null;
  const nearMatch = remaining.match(/^(.+?)-near-(.+)$/);
  if (nearMatch) {
    nearLandmark = nearMatch[2];
    remaining = nearMatch[1];
  } else if (remaining.startsWith("near-")) {
    nearLandmark = remaining.slice(5);
    remaining = "things-to-do"; // default category for "near" searches
  }

  // 5. Try to match neighbourhood before the remaining category
  let neighbourhoodSlug: string | null = null;
  if (!nearLandmark) {
    const cityNeighbourhoods = knownNeighbourhoods
      .filter((n) => n.citySlug === citySlug)
      .sort((a, b) => b.slug.length - a.slug.length);

    for (const nb of cityNeighbourhoods) {
      if (remaining.endsWith("-" + nb.slug)) {
        neighbourhoodSlug = nb.slug;
        remaining = remaining.slice(0, -(nb.slug.length + 1));
        break;
      } else if (remaining === nb.slug) {
        neighbourhoodSlug = nb.slug;
        remaining = "";
        break;
      }
    }
  }

  // 6. Whatever remains is the category slug
  let categorySlug = remaining || "things-to-do";

  // Apply aliases
  if (CATEGORY_ALIASES[categorySlug]) {
    categorySlug = CATEGORY_ALIASES[categorySlug];
  }

  if (!categorySlug) return null;

  return { modifierSlug, categorySlug, neighbourhoodSlug, citySlug, timeIntent, nearLandmark };
}

/**
 * Generate a unique SEO title for a programmatic page.
 */
export function generateTitle(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  cityName?: string,
  timeIntent?: string | null
): string {
  const location = cityName
    ? `${locationName}, ${cityName}`
    : locationName;
  const timeLabel = formatTimeIntent(timeIntent);
  const timeSuffix = timeLabel ? ` ${timeLabel}` : "";

  if (modifier) {
    const cap = modifier.charAt(0).toUpperCase() + modifier.slice(1);
    return `${cap} ${categoryName} in ${location}${timeSuffix} | Top ${categoryName} Spots`;
  }
  return `${categoryName} in ${location}${timeSuffix} | Find the Best ${categoryName}`;
}

/**
 * Generate a unique meta description.
 */
export function generateMetaDescription(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  cityName?: string,
  timeIntent?: string | null
): string {
  const location = cityName
    ? `${locationName}, ${cityName}`
    : locationName;
  const catLower = categoryName.toLowerCase();
  const timeLabel = formatTimeIntent(timeIntent);
  const timePart = timeLabel ? ` ${timeLabel.toLowerCase()}` : "";

  if (modifier) {
    return `Discover the ${modifier} ${catLower} in ${location}${timePart}. Our curated guide to top-rated ${catLower} with ratings, reviews and maps.`;
  }
  return `Find the best ${catLower} in ${location}${timePart}. Browse ratings, reviews and directions for top ${catLower} near you.`;
}

/**
 * Generate unique intro text for the page body.
 */
export function generateIntroText(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  listingCount: number,
  cityName?: string,
  timeIntent?: string | null
): string {
  const location = cityName
    ? `${locationName}, ${cityName}`
    : locationName;
  const catLower = categoryName.toLowerCase();
  const timeLabel = formatTimeIntent(timeIntent);
  const timePart = timeLabel ? ` ${timeLabel.toLowerCase()}` : "";

  const intros = [
    `Looking for ${modifier ? modifier + " " : ""}${catLower} in ${location}${timePart}? We've hand-picked ${listingCount > 0 ? listingCount : "the top"} places based on real reviews and ratings to help you find exactly what you're after.`,
    `Whether you're a local or just visiting, ${location} has no shortage of fantastic ${catLower}${timePart}. Here are our top picks${modifier ? ` for ${modifier} options` : ""}.`,
    `${location} is home to some incredible ${catLower}. We've done the research so you don't have to — browse our curated selection${timePart} below.`,
  ];

  const hash = (modifier || "").length + categoryName.length + locationName.length;
  return intros[hash % intros.length];
}

/**
 * Build a programmatic page URL from components.
 */
export function buildPageUrl(
  modifierSlug: string | null,
  categorySlug: string,
  neighbourhoodSlug: string | null,
  citySlug: string,
  timeIntent?: string | null
): string {
  const parts = [modifierSlug, categorySlug, neighbourhoodSlug, citySlug].filter(Boolean);
  let url = "/" + parts.join("-");
  if (timeIntent) url += "-" + timeIntent;
  return url;
}

/**
 * Format time intent for display.
 */
export function formatTimeIntent(timeIntent?: string | null): string {
  if (!timeIntent) return "";
  const map: Record<string, string> = {
    "today": "Today",
    "tonight": "Tonight",
    "this-week": "This Week",
    "this-weekend": "This Weekend",
  };
  return map[timeIntent] || "";
}

/**
 * Get date range for a time intent.
 */
export function getTimeIntentDateRange(timeIntent: string | null): { start: string; end: string } | null {
  if (!timeIntent) return null;

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (timeIntent) {
    case "today":
    case "tonight":
      return { start: today, end: today };
    case "this-week": {
      const endOfWeek = new Date(now);
      const daysUntilSunday = 7 - now.getDay();
      endOfWeek.setDate(now.getDate() + daysUntilSunday);
      return { start: today, end: endOfWeek.toISOString().split("T")[0] };
    }
    case "this-weekend": {
      const saturday = new Date(now);
      const daysUntilSat = (6 - now.getDay() + 7) % 7;
      saturday.setDate(now.getDate() + (daysUntilSat === 0 && now.getDay() === 6 ? 0 : daysUntilSat));
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      return { start: saturday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
    }
    default:
      return null;
  }
}

/**
 * Check if a category slug is event-related.
 */
export function isEventCategory(categorySlug: string): boolean {
  return ["events", "live-music", "theatre", "exhibitions", "comedy", "markets", "festivals"].includes(categorySlug);
}
