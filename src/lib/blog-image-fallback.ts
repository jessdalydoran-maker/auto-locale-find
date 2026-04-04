import { getCategoryPlaceholder } from "@/lib/image-utils";

export const BLOG_PLACEHOLDER_IMAGE = "/placeholder.svg";

const DEPRECATED_BLOG_IMAGE_HOSTS = ["source.unsplash.com"];
const BLOG_IMAGE_SRC_REGEX = /(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi;

type BlogImageContext = {
  content?: string | null;
  excerpt?: string | null;
  title?: string | null;
};

function stripHtml(html?: string | null) {
  if (!html) return "";

  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractDeprecatedImageKeywords(url?: string | null) {
  if (!url || !hasDeprecatedBlogImageUrl(url)) return "";

  const [, keywordQuery = ""] = url.split("/?");
  return decodeURIComponent(keywordQuery).replace(/[+,]/g, " ").trim();
}

export function getBlogFallbackImage(context: BlogImageContext = {}, url?: string | null) {
  const description = [
    context.excerpt,
    extractDeprecatedImageKeywords(url),
    stripHtml(context.content).slice(0, 500),
  ]
    .filter(Boolean)
    .join(" ");

  return getCategoryPlaceholder(undefined, context.title, undefined, description);
}

export function replaceWithBlogPlaceholder(img: HTMLImageElement, context: BlogImageContext = {}) {
  const fallbackAttempt = Number(img.dataset.fallbackAttempt || "0");
  const contextualFallback = getBlogFallbackImage(context, img.currentSrc || img.src);

  img.removeAttribute("srcset");
  img.decoding = "async";

  if (
    fallbackAttempt < 1 &&
    contextualFallback &&
    contextualFallback !== img.currentSrc &&
    contextualFallback !== img.src
  ) {
    img.dataset.fallbackAttempt = "1";
    img.src = contextualFallback;
    return;
  }

  if (fallbackAttempt < 2 && img.currentSrc !== BLOG_PLACEHOLDER_IMAGE && img.src !== BLOG_PLACEHOLDER_IMAGE) {
    img.dataset.fallbackAttempt = "2";
    img.src = BLOG_PLACEHOLDER_IMAGE;
    return;
  }

  img.style.display = "none";
}

export function hasDeprecatedBlogImageUrl(url?: string | null) {
  if (!url) return false;

  return DEPRECATED_BLOG_IMAGE_HOSTS.some((host) => url.includes(host));
}

export function replaceDeprecatedBlogImageUrls(html?: string | null, context: BlogImageContext = {}) {
  if (!html) return "";

  return html.replace(BLOG_IMAGE_SRC_REGEX, (match, prefix, url, suffix) => {
    if (!hasDeprecatedBlogImageUrl(url)) return match;

    return `${prefix}${getBlogFallbackImage(context, url)}${suffix}`;
  });
}

export function enhanceBlogContentImages(container: HTMLElement | null, context: BlogImageContext = {}) {
  if (!container) return;

  const images = container.querySelectorAll("img");

  images.forEach((image, index) => {
    const img = image as HTMLImageElement;
    img.loading = "lazy";
    img.decoding = "async";

    if (!img.alt?.trim() && context.title) {
      img.alt = `${context.title} image ${index + 1}`;
    }

    if (hasDeprecatedBlogImageUrl(img.currentSrc || img.src)) {
      replaceWithBlogPlaceholder(img, context);
    }

    img.onerror = () => replaceWithBlogPlaceholder(img, context);
  });
}