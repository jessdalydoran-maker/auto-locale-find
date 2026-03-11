/**
 * Search relevance scoring utilities.
 * Location-first scoring: city match is the dominant factor.
 * Results from wrong cities are heavily penalized when a location is specified.
 */

import type { SearchIntent } from "./search-intent";

export interface ScoredItem<T> {
  item: T;
  score: number;
  isNearby?: boolean;
}

/**
 * Score a listing against a search query for relevance ranking.
 * Location match is the highest-weight factor.
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
  const citySlug = listing.cities?.slug;

  // ── 1. LOCATION (highest weight — 2000 points) ──
  if (intent.hasExplicitLocation && intent.city) {
    if (citySlug === intent.city) {
      score += 2000; // exact city match
    } else {
      // Wrong city when user specified one → heavy penalty
      score -= 500;
    }
  }

  // ── 2. Exact name match (1000 points) ──
  if (nameLower === queryLower) {
    score += 1000;
  } else if (nameLower.includes(queryLower)) {
    score += 500;
  } else if (queryLower.includes(nameLower)) {
    score += 400;
  }

  // ── 3. Word-level name matching ──
  // Strip location and noise words from query for name matching
  const queryWords = queryLower
    .split(/\s+/)
    .filter(w => w.length > 2 && !isLocationWord(w));
  const nameWords = nameLower.split(/\s+/);
  for (const qw of queryWords) {
    if (nameWords.some(nw => nw === qw)) {
      score += 100;
    } else if (nameWords.some(nw => nw.startsWith(qw) || nw.includes(qw))) {
      score += 50;
    }
  }

  // ── 4. Category match from intent (200 points) ──
  const catSlug = listing.categories?.slug;
  if (catSlug && intent.categorySlugs.includes(catSlug)) {
    score += 200;
  }

  // ── 5. Audience tag match (150 points each) ──
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

  // ── 6. Description keyword match ──
  const desc = (listing.short_description || listing.description || "").toLowerCase();
  for (const kw of intent.keywords) {
    if (!isLocationWord(kw) && desc.includes(kw)) {
      score += 30;
    }
  }

  // ── 7. Rating boost (minor) ──
  if (listing.rating && listing.rating > 0) {
    score += Math.min(listing.rating * 5, 25);
  }

  return score;
}

/**
 * Score an event against a search query.
 * Location is the dominant factor.
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
  const citySlug = event.cities?.slug;

  // ── 1. LOCATION (highest weight) ──
  if (intent.hasExplicitLocation && intent.city) {
    if (citySlug === intent.city) {
      score += 2000;
    } else {
      score -= 500;
    }
  }

  // Exact title match
  if (titleLower === queryLower) {
    score += 1000;
  } else if (titleLower.includes(queryLower)) {
    score += 500;
  } else if (queryLower.includes(titleLower)) {
    score += 400;
  }

  // Word-level title matching (exclude location words)
  const queryWords = queryLower
    .split(/\s+/)
    .filter(w => w.length > 2 && !isLocationWord(w));
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

  // Description match
  const desc = (event.short_description || event.description || "").toLowerCase();
  for (const kw of intent.keywords) {
    if (!isLocationWord(kw) && desc.includes(kw)) score += 25;
  }

  return score;
}

/**
 * Check if a word is a known location name (to avoid false positive scoring)
 */
const LOCATION_WORDS = new Set([
  "belfast", "lisburn", "bangor", "newry", "armagh", "derry", "londonderry",
  "omagh", "strabane", "ballymena", "coleraine", "portrush", "portstewart",
  "enniskillen", "antrim", "carrickfergus", "larne", "newtownabbey",
  "newtownards", "downpatrick", "dungannon", "cookstown", "magherafelt",
  "limavady", "ballycastle", "holywood", "comber", "hillsborough",
  "dromore", "craigavon", "portadown", "lurgan", "warrenpoint",
  "newcastle", "ballynahinch", "northern", "ireland",
  "town", "city", "centre", "center", "area", "village",
]);

function isLocationWord(word: string): boolean {
  return LOCATION_WORDS.has(word.toLowerCase());
}

/**
 * Sort items by score descending, filter out low/negative scores.
 * When location is explicit, use a higher minimum threshold.
 */
export function rankAndFilter<T>(
  scored: ScoredItem<T>[],
  minScore = 10,
  hasExplicitLocation = false
): T[] {
  const threshold = hasExplicitLocation ? 100 : minScore;
  return scored
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);
}
