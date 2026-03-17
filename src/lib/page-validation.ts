/**
 * Page validation and quality check system.
 * Validates content completeness, card integrity, deduplication,
 * and determines page readiness status before rendering/indexing.
 */

// ─── Validation Status ───

export type PageValidationStatus =
  | "complete"        // Meets all thresholds, fully ready
  | "limited"         // Has some content but below ideal threshold
  | "needs-more-data" // Too thin to render as a full page
  | "hidden-from-index"; // Should not be indexed (noindex)

export interface PageValidationResult {
  status: PageValidationStatus;
  listingCount: number;
  uniqueListingCount: number;
  duplicatesRemoved: number;
  missingFields: CardIssue[];
  hasIntro: boolean;
  hasSectionHeading: boolean;
  hasFaq: boolean;
  shouldIndex: boolean;
  shouldRender: boolean;
  message: string | null;
}

export interface CardIssue {
  listingId: string;
  listingName: string;
  issues: string[];
}

// ─── Thresholds per page type ───

export interface PageThresholds {
  minimum: number;       // Below this → needs-more-data
  ideal: number;         // Below this → limited
  nicheMinimum: number;  // For niche/modifier pages
}

export const PAGE_THRESHOLDS: Record<string, PageThresholds> = {
  city: { minimum: 4, ideal: 10, nicheMinimum: 3 },
  neighbourhood: { minimum: 4, ideal: 8, nicheMinimum: 3 },
  category: { minimum: 4, ideal: 10, nicheMinimum: 3 },
  niche: { minimum: 3, ideal: 6, nicheMinimum: 3 },
  events: { minimum: 1, ideal: 4, nicheMinimum: 1 },
  landmark: { minimum: 3, ideal: 6, nicheMinimum: 3 },
};

// ─── Page type detection ───

export function detectPageType(opts: {
  isNeighbourhood: boolean;
  isLandmark: boolean;
  isEvents: boolean;
  hasModifier: boolean;
  categorySlug?: string | null;
}): string {
  if (opts.isEvents) return "events";
  if (opts.isLandmark) return "landmark";
  if (opts.isNeighbourhood) return "neighbourhood";
  if (opts.hasModifier) return "niche";
  if (opts.categorySlug && opts.categorySlug !== "things-to-do") return "category";
  return "city";
}

// ─── Card completeness validation ───

interface ListingLike {
  id: string;
  name: string;
  slug?: string;
  short_description?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_status?: string | null;
  address?: string | null;
  categories?: { name?: string; slug?: string } | null;
  cities?: { name?: string; slug?: string } | null;
}

export function validateCard(listing: ListingLike): string[] {
  const issues: string[] = [];
  if (!listing.name?.trim()) issues.push("missing-title");
  if (!listing.short_description?.trim() && !listing.description?.trim()) issues.push("missing-description");
  if (!(listing.categories as any)?.name) issues.push("missing-category");
  if (!(listing.cities as any)?.name && !listing.address) issues.push("missing-location");
  // Image: we rely on fallback system, so only flag if there's a broken URL with no fallback possible
  return issues;
}

export function validateEventCard(event: {
  id: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  date_start: string;
  venue_name?: string | null;
  venue_address?: string | null;
  cities?: { name?: string } | null;
}): string[] {
  const issues: string[] = [];
  if (!event.title?.trim()) issues.push("missing-title");
  if (!event.short_description?.trim() && !event.description?.trim()) issues.push("missing-description");
  if (!event.date_start) issues.push("missing-date");
  if (!event.venue_name && !event.venue_address && !(event.cities as any)?.name) issues.push("missing-location");
  return issues;
}

// ─── Deduplication ───

export function deduplicateListings<T extends { id: string; name: string; slug?: string }>(
  listings: T[]
): { unique: T[]; duplicatesRemoved: number } {
  const seen = new Map<string, T>();
  const seenNames = new Map<string, T>();

  for (const listing of listings) {
    // Deduplicate by ID first
    if (seen.has(listing.id)) continue;

    // Deduplicate by normalized name (catches near-duplicates)
    const normalizedName = listing.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenNames.has(normalizedName)) continue;

    seen.set(listing.id, listing);
    seenNames.set(normalizedName, listing);
  }

  const unique = Array.from(seen.values());
  return {
    unique,
    duplicatesRemoved: listings.length - unique.length,
  };
}

// ─── Full page validation ───

export function validatePage(opts: {
  listings: ListingLike[];
  events?: any[];
  pageType: string;
  hasIntro: boolean;
  hasSectionHeading: boolean;
  hasFaq: boolean;
  isNicheModifier?: boolean;
}): PageValidationResult {
  const { listings, events = [], pageType, hasIntro, hasSectionHeading, hasFaq, isNicheModifier } = opts;
  const thresholds = PAGE_THRESHOLDS[pageType] || PAGE_THRESHOLDS.category;
  const minThreshold = isNicheModifier ? thresholds.nicheMinimum : thresholds.minimum;

  // Deduplicate
  const { unique, duplicatesRemoved } = deduplicateListings(listings);
  const totalCount = unique.length + events.length;

  // Validate cards
  const missingFields: CardIssue[] = [];
  for (const listing of unique) {
    const issues = validateCard(listing);
    if (issues.length > 0) {
      missingFields.push({ listingId: listing.id, listingName: listing.name, issues });
    }
  }
  for (const event of events) {
    const issues = validateEventCard(event);
    if (issues.length > 0) {
      missingFields.push({ listingId: event.id, listingName: event.title, issues });
    }
  }

  // Determine status
  let status: PageValidationStatus;
  let message: string | null = null;

  if (totalCount === 0) {
    status = "hidden-from-index";
    message = "No content available for this page yet.";
  } else if (totalCount < minThreshold) {
    status = "needs-more-data";
    message = `Limited results in this area — we're curating more recommendations.`;
  } else if (totalCount < thresholds.ideal) {
    status = "limited";
    message = "We're still growing our recommendations for this area.";
  } else {
    status = "complete";
  }

  const shouldIndex = status === "complete" || status === "limited";
  const shouldRender = status !== "hidden-from-index" || totalCount > 0;

  return {
    status,
    listingCount: totalCount,
    uniqueListingCount: unique.length,
    duplicatesRemoved,
    missingFields,
    hasIntro,
    hasSectionHeading,
    hasFaq,
    shouldIndex,
    shouldRender,
    message,
  };
}

// ─── Auto-generated supporting content ───

export function generateSupportingIntro(
  categoryName: string,
  locationName: string,
  itemCount: number,
  pageType: string,
  modifierName?: string | null,
): string {
  const modPrefix = modifierName ? `${modifierName} ` : "";
  const catLower = categoryName.toLowerCase();

  if (pageType === "neighbourhood") {
    return `Discover the best ${modPrefix}${catLower} in ${locationName}. We've curated ${itemCount} local recommendation${itemCount !== 1 ? "s" : ""} to help you explore what this area has to offer.`;
  }
  if (pageType === "events") {
    return `Browse upcoming ${modPrefix}${catLower} in ${locationName}. From local favourites to hidden gems, find what's happening near you.`;
  }
  if (pageType === "niche") {
    return `Looking for ${modPrefix}${catLower} in ${locationName}? Here are our top picks — hand-selected for quality and relevance.`;
  }
  return `Explore the best ${modPrefix}${catLower} in ${locationName}. We've gathered ${itemCount} curated recommendation${itemCount !== 1 ? "s" : ""} based on reviews, ratings and local knowledge.`;
}

export function generateSupportingAreaDescription(
  locationName: string,
  categoryName: string,
  pageType: string,
): string | null {
  if (pageType === "neighbourhood") {
    return `${locationName} is a popular area known for its local character and range of ${categoryName.toLowerCase()}. Whether you're visiting for the first time or a regular, there's always something new to discover.`;
  }
  if (pageType === "city") {
    return `${locationName} offers a vibrant mix of ${categoryName.toLowerCase()} across its many neighbourhoods and districts. Use this guide to find the best options near you.`;
  }
  return null;
}

// ─── SEO robots meta helper ───

export function getRobotsDirective(validation: PageValidationResult): string | null {
  if (!validation.shouldIndex) {
    return "noindex, follow";
  }
  return null; // default: allow indexing
}

// ─── Filter out incomplete cards ───

export function filterCompleteListings<T extends ListingLike>(listings: T[]): T[] {
  return listings.filter((l) => {
    // Must have at minimum: name and some form of location
    if (!l.name?.trim()) return false;
    return true;
  });
}

export function filterCompleteEvents<T extends { title: string; date_start: string }>(events: T[]): T[] {
  return events.filter((e) => {
    if (!e.title?.trim()) return false;
    if (!e.date_start) return false;
    return true;
  });
}
