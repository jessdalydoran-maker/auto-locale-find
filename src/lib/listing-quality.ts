/**
 * Listing quality filters and weighted scoring.
 * Centralises data quality rules so all public-facing queries
 * apply the same minimum thresholds.
 */

/** Minimum thresholds for public-facing listings */
export const QUALITY_THRESHOLDS = {
  MIN_REVIEW_COUNT: 15,
  MIN_RATING: 4.0,
} as const;

/**
 * Weighted score: rating × log10(review_count + 1)
 * A 4.7★ place with 500 reviews scores higher than a 5.0★ with 2 reviews.
 */
export function weightedScore(rating: number | null, reviewCount: number | null): number {
  const r = rating ?? 0;
  const rc = reviewCount ?? 0;
  return r * Math.log10(rc + 1);
}

/**
 * Check whether a listing passes the minimum quality bar
 * for public display.
 */
export function meetsQualityThreshold(listing: {
  rating?: number | null;
  review_count?: number | null;
  short_description?: string | null;
  address?: string | null;
}): boolean {
  if ((listing.review_count ?? 0) < QUALITY_THRESHOLDS.MIN_REVIEW_COUNT) return false;
  if ((listing.rating ?? 0) < QUALITY_THRESHOLDS.MIN_RATING) return false;
  if (!listing.short_description) return false;
  if (!listing.address) return false;
  return true;
}

/**
 * Filter an array of listings by quality thresholds,
 * then sort by featured-first + weighted score descending.
 */
export function filterAndRankListings<T extends {
  rating?: number | null;
  review_count?: number | null;
  short_description?: string | null;
  address?: string | null;
  is_featured?: boolean;
}>(listings: T[]): T[] {
  const qualified = listings.filter(meetsQualityThreshold);

  return qualified.sort((a, b) => {
    // Featured always first
    const aFeat = a.is_featured ? 1 : 0;
    const bFeat = b.is_featured ? 1 : 0;
    if (aFeat !== bFeat) return bFeat - aFeat;

    // Then by weighted score
    return weightedScore(b.rating ?? 0, b.review_count ?? 0) - weightedScore(a.rating ?? 0, a.review_count ?? 0);
  });
}

/**
 * Sort-only version (no filtering) for admin/internal use.
 */
export function rankByWeightedScore<T extends {
  rating?: number | null;
  review_count?: number | null;
  is_featured?: boolean;
}>(listings: T[]): T[] {
  return [...listings].sort((a, b) => {
    const aFeat = a.is_featured ? 1 : 0;
    const bFeat = b.is_featured ? 1 : 0;
    if (aFeat !== bFeat) return bFeat - aFeat;
    return weightedScore(b.rating ?? 0, b.review_count ?? 0) - weightedScore(a.rating ?? 0, a.review_count ?? 0);
  });
}
