/**
 * Image utilities for venue-specific photo matching,
 * category-based fallbacks, alt text generation, and WebP support.
 *
 * RULES:
 * - Only display an image if it is verified (image_status = 'verified')
 *   or manually set by admin (image_source = 'manual').
 * - All other images use the category placeholder.
 * - It is better to show a placeholder than the wrong venue.
 */

/**
 * Category-specific placeholder images.
 * Neutral, high-quality stock that represents the category — not a specific venue.
 */
export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  // Food & Drink
  "restaurants": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&fm=webp&q=80",
  "cafes": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&fm=webp&q=80",
  "brunch": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&fm=webp&q=80",
  "bars": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&fm=webp&q=80",
  "cocktail-bars": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&fm=webp&q=80",
  "nightlife": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&fm=webp&q=80",
  "coffee-shops": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&fm=webp&q=80",
  "italian": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&fm=webp&q=80",

  // Activities
  "things-to-do": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&fm=webp&q=80",
  "attractions": "https://images.unsplash.com/photo-1569949381669-ecf31ae8f613?w=600&fm=webp&q=80",
  "museums": "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&fm=webp&q=80",
  "tours": "https://images.unsplash.com/photo-1476304884326-cd2c88572c5f?w=600&fm=webp&q=80",
  "parks": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&fm=webp&q=80",
  "cinemas": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&fm=webp&q=80",
  "escape-rooms": "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&fm=webp&q=80",
  "sports": "https://images.unsplash.com/photo-1461896836934-bd45ba1a603c?w=600&fm=webp&q=80",
  "indoor-activities": "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&fm=webp&q=80",
  "family-activities": "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=600&fm=webp&q=80",
  "date-night": "https://images.unsplash.com/photo-1529543544282-ea8407407d89?w=600&fm=webp&q=80",
  "hidden-gems": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&fm=webp&q=80",
  "gyms": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&fm=webp&q=80",

  // Events
  "events": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&fm=webp&q=80",
  "live-music": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&fm=webp&q=80",
  "theatre": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&fm=webp&q=80",
  "exhibitions": "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&fm=webp&q=80",
  "comedy": "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&fm=webp&q=80",
  "markets": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&fm=webp&q=80",
  "festivals": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&fm=webp&q=80",
};

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&fm=webp&q=80";

/** Trusted image sources that bypass verification */
const TRUSTED_SOURCES = new Set(["google_places", "manual", "official"]);

/**
 * Get the image URL for a listing or event.
 *
 * Only returns the venue-specific image if:
 *   - image_status is 'verified', OR
 *   - image_source is a trusted source (google_places, manual, official)
 *
 * Otherwise returns the category placeholder.
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  imageSource: string | null | undefined,
  categorySlug?: string | null,
  citySlug?: string | null,
  imageStatus?: string | null
): string {
  // Only use venue image if verified or from a trusted source
  const isVerified = imageStatus === "verified";
  const isTrustedSource = imageSource ? TRUSTED_SOURCES.has(imageSource) : false;

  if (imageUrl && (isVerified || isTrustedSource)) {
    return ensureWebP(imageUrl);
  }

  // Everything else: use category placeholder
  return getCategoryPlaceholder(categorySlug, citySlug);
}

/**
 * Get the category placeholder image.
 */
export function getCategoryPlaceholder(
  categorySlug?: string | null,
  citySlug?: string | null
): string {
  if (categorySlug && CATEGORY_PLACEHOLDERS[categorySlug]) {
    return CATEGORY_PLACEHOLDERS[categorySlug];
  }
  return DEFAULT_PLACEHOLDER;
}

/**
 * Check if an image is a category placeholder (not venue-specific).
 */
export function isPlaceholderImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return true;
  return Object.values(CATEGORY_PLACEHOLDERS).some((p) => imageUrl.includes(p.split("?")[0]));
}

/**
 * Ensure Unsplash URLs use WebP format.
 */
function ensureWebP(url: string): string {
  if (!url) return DEFAULT_PLACEHOLDER;

  if (url.includes("unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("fm", "webp");
      u.searchParams.set("q", "80");
      if (!u.searchParams.has("w")) {
        u.searchParams.set("w", "600");
      }
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Generate SEO-optimised alt text for a listing image.
 * For placeholders, uses neutral category description — never a specific venue name.
 */
export function generateListingAltText(
  venueName: string,
  categoryName?: string | null,
  neighbourhood?: string | null,
  cityName?: string | null,
  isPlaceholder?: boolean
): string {
  if (isPlaceholder) {
    const parts = [];
    if (categoryName) parts.push(categoryName);
    if (neighbourhood) parts.push(`in ${neighbourhood}`);
    if (cityName) parts.push(cityName);
    return parts.length > 0 ? parts.join(" — ") : "Venue image coming soon";
  }

  const parts = [venueName];
  if (categoryName) parts.push(categoryName.toLowerCase());
  if (neighbourhood) parts.push(`in ${neighbourhood}`);
  if (cityName && !neighbourhood) parts.push(`in ${cityName}`);
  else if (cityName && neighbourhood) parts.push(cityName);
  return parts.join(" — ");
}

/**
 * Generate SEO-optimised alt text for an event image.
 */
export function generateEventAltText(
  eventTitle: string,
  venueName?: string | null,
  cityName?: string | null,
  isPlaceholder?: boolean
): string {
  if (isPlaceholder) {
    const parts = ["Event"];
    if (cityName) parts.push(`in ${cityName}`);
    return parts.join(" ");
  }

  const parts = [eventTitle];
  if (venueName) parts.push(`at ${venueName}`);
  if (cityName) parts.push(`in ${cityName}`);
  return parts.join(" ");
}

/**
 * Generate alt text for a city image.
 */
export function generateCityAltText(cityName: string): string {
  return `${cityName} city skyline — things to do and places to visit`;
}

/**
 * Image source types for tracking provenance.
 */
export type ImageSource =
  | "google_places"   // From Google Places Photo API via place_id
  | "manual"          // Manually uploaded by admin
  | "official"        // From venue's official source
  | "scrape"          // Scraped from venue website (needs review)
  | "unsplash"        // From Unsplash (generic, needs review)
  | "fallback";       // Category/generic placeholder

/**
 * Image verification statuses.
 */
export type ImageStatus =
  | "verified"       // Confirmed to be the correct venue image
  | "needs_review"   // Not yet verified — shows placeholder
  | "placeholder";   // No venue image available — using category placeholder
