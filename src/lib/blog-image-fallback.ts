export const BLOG_PLACEHOLDER_IMAGE = "/placeholder.svg";

const DEPRECATED_BLOG_IMAGE_HOSTS = ["source.unsplash.com"];

export function replaceWithBlogPlaceholder(img: HTMLImageElement) {
  if (img.dataset.fallbackApplied === "true") {
    img.style.display = "none";
    return;
  }

  img.dataset.fallbackApplied = "true";
  img.src = BLOG_PLACEHOLDER_IMAGE;
}

export function hasDeprecatedBlogImageUrl(url?: string | null) {
  if (!url) return false;

  return DEPRECATED_BLOG_IMAGE_HOSTS.some((host) => url.includes(host));
}

export function enhanceBlogContentImages(container: HTMLElement | null) {
  if (!container) return;

  const images = container.querySelectorAll("img");

  images.forEach((image) => {
    const img = image as HTMLImageElement;
    img.loading = "lazy";

    if (hasDeprecatedBlogImageUrl(img.currentSrc || img.src)) {
      replaceWithBlogPlaceholder(img);
    }

    img.onerror = () => replaceWithBlogPlaceholder(img);
  });
}