/**
 * Image utilities for venue-specific photo matching,
 * category-based fallbacks, alt text generation, and WebP support.
 */

/**
 * Category-specific fallback images from Unsplash.
 * Each uses a curated, relevant photo — not random stock.
 * Format parameter ensures WebP delivery.
 */
const CATEGORY_FALLBACKS: Record<string, string> = {
  // Food & Drink
  "restaurants": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&fm=webp&q=80",
  "cafes": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&fm=webp&q=80",
  "brunch": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&fm=webp&q=80",
  "bars": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&fm=webp&q=80",
  "cocktail-bars": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&fm=webp&q=80",
  "nightlife": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&fm=webp&q=80",

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

  // Events
  "events": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&fm=webp&q=80",
  "live-music": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&fm=webp&q=80",
  "theatre": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&fm=webp&q=80",
  "exhibitions": "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&fm=webp&q=80",
  "comedy": "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&fm=webp&q=80",
  "markets": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&fm=webp&q=80",
  "festivals": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&fm=webp&q=80",

  // City fallbacks
  "belfast": "https://images.unsplash.com/photo-1572883454114-efb8ff4e08d3?w=600&fm=webp&q=80",
  "london": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&fm=webp&q=80",
  "manchester": "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?w=600&fm=webp&q=80",
  "edinburgh": "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=600&fm=webp&q=80",
  "glasgow": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&fm=webp&q=80",
  "derry": "https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=600&fm=webp&q=80",
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&fm=webp&q=80";

/**
 * Get the best image URL for a listing or event.
 * Priority:
 *   1. Venue-specific image (from place_id / direct URL)
 *   2. Category-specific fallback
 *   3. Generic fallback
 *
 * Appends WebP format param to Unsplash URLs.
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  imageSource: string | null | undefined,
  categorySlug?: string | null,
  citySlug?: string | null
): string {
  // 1. Use venue-specific image if available
  if (imageUrl && imageSource !== "fallback") {
    return ensureWebP(imageUrl);
  }

  // 2. If we have an image URL but it's marked as fallback, still use it
  //    (admin may have manually set a good image)
  if (imageUrl) {
    return ensureWebP(imageUrl);
  }

  // 3. Category-specific fallback
  if (categorySlug && CATEGORY_FALLBACKS[categorySlug]) {
    return CATEGORY_FALLBACKS[categorySlug];
  }

  // 4. City-specific fallback
  if (citySlug && CATEGORY_FALLBACKS[citySlug]) {
    return CATEGORY_FALLBACKS[citySlug];
  }

  // 5. Generic
  return DEFAULT_FALLBACK;
}

/**
 * Get a category-specific fallback image.
 */
export function getCategoryFallbackImage(categorySlug: string): string {
  return CATEGORY_FALLBACKS[categorySlug] || DEFAULT_FALLBACK;
}

/**
 * Get a city-specific fallback image.
 */
export function getCityFallbackImage(citySlug: string): string {
  return CATEGORY_FALLBACKS[citySlug] || DEFAULT_FALLBACK;
}

/**
 * Ensure Unsplash URLs use WebP format.
 */
function ensureWebP(url: string): string {
  if (!url) return DEFAULT_FALLBACK;

  // Unsplash URLs: add/replace fm=webp
  if (url.includes("unsplash.com")) {
    const u = new URL(url);
    u.searchParams.set("fm", "webp");
    u.searchParams.set("q", "80");
    if (!u.searchParams.has("w")) {
      u.searchParams.set("w", "600");
    }
    return u.toString();
  }

  return url;
}

/**
 * Generate SEO-optimised alt text for a listing image.
 */
export function generateListingAltText(
  venueName: string,
  categoryName?: string | null,
  neighbourhood?: string | null,
  cityName?: string | null
): string {
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
  cityName?: string | null
): string {
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
  | "scrape"          // Scraped from venue website
  | "fallback";       // Category/generic fallback
