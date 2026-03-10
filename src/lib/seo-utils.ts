/**
 * Programmatic SEO slug parsing and content generation.
 *
 * Supported URL patterns:
 *   /best-restaurants-belfast           → modifier + category + city
 *   /cheap-cafes-cathedral-quarter-belfast → modifier + category + neighbourhood + city
 *   /restaurants-belfast                → category + city (no modifier)
 *   /restaurants-cathedral-quarter-belfast → category + neighbourhood + city
 */

export interface ParsedSlug {
  modifierSlug: string | null;
  categorySlug: string;
  neighbourhoodSlug: string | null;
  citySlug: string;
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
];

/**
 * Parse a programmatic SEO slug into its components.
 * Requires known city slugs and neighbourhood slugs to be passed in
 * for accurate multi-word matching.
 */
export function parseSlug(
  slug: string,
  knownCities: string[],
  knownNeighbourhoods: { slug: string; citySlug: string }[]
): ParsedSlug | null {
  if (!slug) return null;

  let remaining = slug;

  // 1. Extract modifier from start
  let modifierSlug: string | null = null;
  for (const mod of KNOWN_MODIFIERS) {
    if (remaining.startsWith(mod + "-")) {
      modifierSlug = mod;
      remaining = remaining.slice(mod.length + 1);
      break;
    }
  }

  // 2. Try to match city at the end
  let citySlug: string | null = null;
  // Sort cities longest-first so multi-word slugs match first
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

  // 3. Try to match neighbourhood before city
  let neighbourhoodSlug: string | null = null;
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

  // 4. Whatever remains is the category slug
  const categorySlug = remaining;
  if (!categorySlug) return null;

  return { modifierSlug, categorySlug, neighbourhoodSlug, citySlug };
}

/**
 * Generate a unique SEO title for a programmatic page.
 */
export function generateTitle(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  cityName?: string
): string {
  const location = cityName
    ? `${locationName}, ${cityName}`
    : locationName;
  if (modifier) {
    const cap = modifier.charAt(0).toUpperCase() + modifier.slice(1);
    return `${cap} ${categoryName} in ${location} | Top ${categoryName} Spots`;
  }
  return `${categoryName} in ${location} | Find the Best ${categoryName}`;
}

/**
 * Generate a unique meta description.
 */
export function generateMetaDescription(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  cityName?: string
): string {
  const location = cityName
    ? `${locationName}, ${cityName}`
    : locationName;
  const catLower = categoryName.toLowerCase();
  if (modifier) {
    return `Discover the ${modifier} ${catLower} in ${location}. Our curated guide to top-rated ${catLower} with ratings, reviews and maps.`;
  }
  return `Find the best ${catLower} in ${location}. Browse ratings, reviews and directions for top ${catLower} near you.`;
}

/**
 * Generate unique intro text for the page body.
 */
export function generateIntroText(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  listingCount: number,
  cityName?: string
): string {
  const location = cityName
    ? `${locationName}, ${cityName}`
    : locationName;
  const catLower = categoryName.toLowerCase();

  const intros = [
    `Looking for ${modifier ? modifier + " " : ""}${catLower} in ${location}? We've hand-picked ${listingCount > 0 ? listingCount : "the top"} places based on real reviews and ratings to help you find exactly what you're after.`,
    `Whether you're a local or just visiting, ${location} has no shortage of fantastic ${catLower}. Here are our top picks${modifier ? ` for ${modifier} options` : ""}.`,
    `${location} is home to some incredible ${catLower}. We've done the research so you don't have to — browse our curated selection below.`,
  ];

  // Use a simple hash to pick a consistent intro per page
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
  citySlug: string
): string {
  const parts = [modifierSlug, categorySlug, neighbourhoodSlug, citySlug].filter(Boolean);
  return "/" + parts.join("-");
}
