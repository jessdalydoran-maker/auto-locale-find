/**
 * Canonical URL utilities.
 * Single source of truth for the production domain.
 */

export const SITE_DOMAIN = "https://cityscoutguide.com";

/**
 * Build a full canonical URL from a path.
 * Always uses the .com production domain.
 */
export function getCanonicalUrl(path?: string): string {
  if (!path || path === "/") return SITE_DOMAIN;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_DOMAIN}${clean}`;
}

/**
 * Set or update the <link rel="canonical"> tag in <head>.
 */
export function setCanonicalTag(path?: string): void {
  const href = getCanonicalUrl(path);
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Set or update an og:url meta tag.
 */
export function setOgUrl(path?: string): void {
  const href = getCanonicalUrl(path);
  let el = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", "og:url");
    document.head.appendChild(el);
  }
  el.setAttribute("content", href);
}

/**
 * Convenience: set both canonical and og:url for the current page path.
 */
export function setPageCanonical(path?: string): void {
  const resolved = path ?? window.location.pathname;
  setCanonicalTag(resolved);
  setOgUrl(resolved);
}
