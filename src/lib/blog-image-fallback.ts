export const BLOG_PLACEHOLDER_IMAGE = "/placeholder.svg";

export function replaceWithBlogPlaceholder(img: HTMLImageElement) {
  if (img.dataset.fallbackApplied === "true") {
    img.style.display = "none";
    return;
  }

  img.dataset.fallbackApplied = "true";
  img.src = BLOG_PLACEHOLDER_IMAGE;
}