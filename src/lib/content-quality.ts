/**
 * Content quality thresholds and automation rules.
 * Controls when pages are published, canonical URL logic,
 * and minimum content requirements.
 */

/** Minimum items required before a page is considered publishable */
export const CONTENT_THRESHOLDS = {
  /** Minimum listings to show a category+city page */
  LISTINGS_MIN: 5,
  /** Minimum events to show an events page */
  EVENTS_MIN: 1,
  /** Minimum listings for modifier-specific pages (e.g. free, family) */
  MODIFIER_LISTINGS_MIN: 4,
  /** Minimum listings for a neighbourhood-specific page */
  NEIGHBOURHOOD_LISTINGS_MIN: 3,
  /** Minimum events for a neighbourhood-specific page */
  NEIGHBOURHOOD_EVENTS_MIN: 1,
  /** Pages below this threshold show a "thin content" notice with links to richer pages */
  THIN_CONTENT_WARNING: 3,
} as const;

/**
 * Determine if a page has enough content to be published.
 */
export function meetsContentThreshold(
  itemCount: number,
  isEvents: boolean,
  isNeighbourhood: boolean
): boolean {
  if (isNeighbourhood) {
    return itemCount >= (isEvents
      ? CONTENT_THRESHOLDS.NEIGHBOURHOOD_EVENTS_MIN
      : CONTENT_THRESHOLDS.NEIGHBOURHOOD_LISTINGS_MIN);
  }
  return itemCount >= (isEvents
    ? CONTENT_THRESHOLDS.EVENTS_MIN
    : CONTENT_THRESHOLDS.LISTINGS_MIN);
}

/**
 * Check if content is thin (published but borderline).
 */
export function isThinContent(itemCount: number): boolean {
  return itemCount > 0 && itemCount < CONTENT_THRESHOLDS.THIN_CONTENT_WARNING;
}

/**
 * Generate the canonical URL for a page.
 * Rules:
 * - "whats-on" aliases → canonical to "events"
 * - Time intents → canonical to the base (no time) version
 * - "best-" prefix variants → canonical to base category+city
 * - Near-landmark pages → canonical to neighbourhood page
 */
export function getCanonicalSlug(
  modifierSlug: string | null,
  categorySlug: string | null,
  neighbourhoodSlug: string | null,
  citySlug: string | null,
  timeIntent: string | null | undefined
): string {
  // "whats-on" → events
  if (categorySlug === "whats-on") {
    categorySlug = "events";
  }

  const parts: string[] = [];

  if (modifierSlug) parts.push(modifierSlug);
  if (categorySlug) parts.push(categorySlug);
  if (neighbourhoodSlug) parts.push(neighbourhoodSlug);
  if (citySlug) parts.push(citySlug);
  // Drop time intent for canonical — the base page is the canonical

  return "/" + parts.join("-");
}

/**
 * Check if two page slugs should share a canonical.
 */
export function arePagesEquivalent(slugA: string, slugB: string): boolean {
  const normA = getCanonicalFromRawSlug(slugA);
  const normB = getCanonicalFromRawSlug(slugB);
  return normA === normB;
}

/**
 * Normalize a raw slug to its canonical form.
 */
export function getCanonicalFromRawSlug(rawSlug: string): string {
  let s = rawSlug.replace(/^\//, "");

  // whats-on → events
  s = s.replace(/^whats-on-/, "events-");

  // Remove time intents from end
  s = s
    .replace(/-today$/, "")
    .replace(/-tonight$/, "")
    .replace(/-this-week$/, "")
    .replace(/-this-weekend$/, "")
    .replace(/-rainy-day$/, "");

  return "/" + s;
}

/**
 * Generate related page links for cross-linking.
 * Returns time-based, category-based, and neighbourhood-based variations.
 */
export function generateRelatedLinks(
  modifierSlug: string | null,
  categorySlug: string | null,
  neighbourhoodSlug: string | null,
  citySlug: string | null,
  timeIntent: string | null | undefined,
  allCategories: { slug: string; name: string }[],
  allNeighbourhoods: { slug: string; name: string; citySlug: string }[],
  currentUrl: string
): { label: string; url: string; type: "time" | "category" | "neighbourhood" }[] {
  const links: { label: string; url: string; type: "time" | "category" | "neighbourhood" }[] = [];

  const buildUrl = (mod: string | null, cat: string | null, nb: string | null, city: string | null, ti: string | null) => {
    const parts: string[] = [];
    if (mod) parts.push(mod);
    if (cat) parts.push(cat);
    if (nb) parts.push(nb);
    if (city) parts.push(city);
    if (ti) parts.push(ti);
    return "/" + parts.join("-");
  };

  // Time variations
  if (!timeIntent) {
    for (const ti of ["today", "this-weekend", "this-week"]) {
      const url = buildUrl(modifierSlug, categorySlug, neighbourhoodSlug, citySlug, ti);
      if (url !== currentUrl) {
        links.push({ label: ti.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), url, type: "time" });
      }
    }
  }

  // Category variations
  const relatedCats = allCategories
    .filter(c => c.slug !== categorySlug)
    .slice(0, 4);
  for (const cat of relatedCats) {
    const url = buildUrl(modifierSlug, cat.slug, neighbourhoodSlug, citySlug, null);
    if (url !== currentUrl) {
      links.push({ label: cat.name, url, type: "category" });
    }
  }

  // Neighbourhood variations
  if (!neighbourhoodSlug && citySlug) {
    const cityNbs = allNeighbourhoods
      .filter(n => n.citySlug === citySlug)
      .slice(0, 4);
    for (const nb of cityNbs) {
      const url = buildUrl(modifierSlug, categorySlug, nb.slug, citySlug, null);
      if (url !== currentUrl) {
        links.push({ label: nb.name, url, type: "neighbourhood" });
      }
    }
  }

  return links;
}
