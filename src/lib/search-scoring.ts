/**
 * Search relevance scoring utilities.
 * Scores listings/events against a parsed search intent for ranked results.
 */

import type { SearchIntent } from "./search-intent";

export interface ScoredItem<T> {
  item: T;
  score: number;
}

/**
 * Score a listing against a search query for relevance ranking.
 * Higher score = more relevant.
 */
export function scoreListing(
  listing: {
    name: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    address?: string | null;
    audience_tags?: string[] | null;
    categories?: { slug: string; name: string } | null;
    cities?: { slug: string; name: string } | null;
    rating?: number | null;
  },
  rawQuery: string,
  intent: SearchIntent
): number {
  let score = 0;
  const queryLower = rawQuery.toLowerCase().trim();
  const nameLower = listing.name.toLowerCase();

  // ── 1. Exact name match (highest priority) ──
  if (nameLower === queryLower) {
    score += 1000;
  } else if (nameLower.includes(queryLower)) {
    score += 500;
  } else if (queryLower.includes(nameLower)) {
    score += 400;
  }

  // ── 2. Word-level name matching ──
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const nameWords = nameLower.split(/\s+/);
  for (const qw of queryWords) {
    if (nameWords.some(nw => nw === qw)) {
      score += 100;
    } else if (nameWords.some(nw => nw.startsWith(qw) || nw.includes(qw))) {
      score += 50;
    }
  }

  // ── 3. Category match from intent ──
  const catSlug = listing.categories?.slug;
  if (catSlug && intent.categorySlugs.includes(catSlug)) {
    score += 200;
  }

  // ── 4. Audience tag match ──
  if (listing.audience_tags?.length) {
    for (const tag of listing.audience_tags) {
      const tagLower = tag.toLowerCase();
      if (intent.categorySlugs.some(c => c.includes(tagLower) || tagLower.includes(c))) {
        score += 150;
      }
      if (queryWords.some(w => tagLower.includes(w))) {
        score += 80;
      }
    }
  }

  // ── 5. City match ──
  const citySlug = listing.cities?.slug;
  if (intent.city && citySlug === intent.city) {
    score += 100;
  } else if (intent.city && citySlug !== intent.city) {
    score -= 50; // penalize wrong city
  }

  // ── 6. Description keyword match ──
  const desc = (listing.short_description || listing.description || "").toLowerCase();
  for (const kw of intent.keywords) {
    if (desc.includes(kw)) {
      score += 30;
    }
  }

  // ── 7. Rating boost ──
  if (listing.rating && listing.rating > 0) {
    score += Math.min(listing.rating * 5, 25);
  }

  return score;
}

/**
 * Score an event against a search query.
 */
export function scoreEvent(
  event: {
    title: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    venue_name?: string | null;
    tags?: string[] | null;
    cities?: { slug: string; name: string } | null;
  },
  rawQuery: string,
  intent: SearchIntent
): number {
  let score = 0;
  const queryLower = rawQuery.toLowerCase().trim();
  const titleLower = event.title.toLowerCase();

  // Exact title match
  if (titleLower === queryLower) {
    score += 1000;
  } else if (titleLower.includes(queryLower)) {
    score += 500;
  } else if (queryLower.includes(titleLower)) {
    score += 400;
  }

  // Word-level title matching
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  for (const qw of queryWords) {
    if (titleLower.includes(qw)) score += 80;
  }

  // Venue name match
  if (event.venue_name) {
    const venueLower = event.venue_name.toLowerCase();
    if (venueLower.includes(queryLower) || queryLower.includes(venueLower)) {
      score += 300;
    }
    for (const qw of queryWords) {
      if (venueLower.includes(qw)) score += 60;
    }
  }

  // Tags match
  if (event.tags?.length) {
    for (const tag of event.tags) {
      const tagLower = tag.toLowerCase();
      if (intent.categorySlugs.some(c => c.includes(tagLower) || tagLower.includes(c))) {
        score += 120;
      }
      if (queryWords.some(w => tagLower.includes(w))) score += 60;
    }
  }

  // City match
  if (intent.city && event.cities?.slug === intent.city) {
    score += 100;
  } else if (intent.city && event.cities?.slug !== intent.city) {
    score -= 50;
  }

  // Description match
  const desc = (event.short_description || event.description || "").toLowerCase();
  for (const kw of intent.keywords) {
    if (desc.includes(kw)) score += 25;
  }

  return score;
}

/**
 * Sort items by score descending, filter out very low scores.
 */
export function rankAndFilter<T>(
  scored: ScoredItem<T>[],
  minScore = 10
): T[] {
  return scored
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);
}
