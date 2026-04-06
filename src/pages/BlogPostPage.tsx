import { useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { setPageCanonical, getCanonicalUrl } from "@/lib/canonical";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock } from "lucide-react";
import {
  BLOG_PLACEHOLDER_IMAGE, enhanceBlogContentImages, getBlogFallbackImage,
  replaceDeprecatedBlogImageUrls, replaceWithBlogPlaceholder,
} from "@/lib/blog-image-fallback";

function setMetaTag(attr: string, key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

function injectJsonLd(data: Record<string, unknown>) {
  const id = "blog-jsonld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) { el = document.createElement("script"); el.id = id; el.type = "application/ld+json"; document.head.appendChild(el); }
  el.textContent = JSON.stringify(data);
}

function estimateReadingTime(html: string | null): number {
  if (!html) return 3;
  const text = html.replace(/<[^>]*>/g, "");
  return Math.max(2, Math.ceil(text.split(/\s+/).length / 230));
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts").select("*").eq("slug", slug || "").eq("status", "published").maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, featured_image_alt, published_at")
        .eq("status", "published")
        .neq("slug", slug || "")
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | City Scout Guide`;
    setPageCanonical(`/blog/${post.slug}`);
    const desc = post.meta_description || post.excerpt || "";
    setMetaTag("name", "description", desc);
    setMetaTag("property", "og:title", post.title);
    setMetaTag("property", "og:description", desc);
    setMetaTag("property", "og:type", "article");
    setMetaTag("property", "og:url", getCanonicalUrl(`/blog/${post.slug}`));
    if (post.featured_image_url) setMetaTag("property", "og:image", post.featured_image_url);
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", post.title);
    setMetaTag("name", "twitter:description", desc);
    injectJsonLd({
      "@context": "https://schema.org", "@type": "Article",
      headline: post.title, description: desc,
      image: post.featured_image_url || undefined,
      datePublished: post.published_at, dateModified: post.updated_at || post.published_at,
      author: { "@type": "Organization", name: post.author || "City Scout Guide" },
      publisher: { "@type": "Organization", name: "City Scout Guide", url: "https://cityscoutguide.com" },
      mainEntityOfPage: getCanonicalUrl(`/blog/${post.slug}`),
    });
    return () => { document.getElementById("blog-jsonld")?.remove(); };
  }, [post]);

  const blogImageContext = useMemo(() => ({ title: post?.title, excerpt: post?.excerpt, content: post?.content }), [post?.content, post?.excerpt, post?.title]);
  const fallbackFeaturedImage = useMemo(() => getBlogFallbackImage(blogImageContext, post?.featured_image_url), [blogImageContext, post?.featured_image_url]);
  const renderedContent = useMemo(() => replaceDeprecatedBlogImageUrls(post?.content, blogImageContext), [blogImageContext, post?.content]);
  const readingTime = useMemo(() => estimateReadingTime(post?.content), [post?.content]);

  useEffect(() => { enhanceBlogContentImages(contentRef.current, blogImageContext); }, [blogImageContext, renderedContent]);

  if (isLoading) {
    return (
      <Layout><div className="container mx-auto px-4 py-10 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" />
      </div></Layout>
    );
  }

  if (!post) {
    return (
      <Layout><div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Post not found</h1>
        <Link to="/blog" className="text-accent hover:underline">← Back to blog</Link>
      </div></Layout>
    );
  }

  return (
    <Layout>
      {/* Full-width hero image with overlay */}
      <div className="relative w-full aspect-[2/1] md:aspect-[5/2] max-h-[500px] overflow-hidden">
        <img
          src={post.featured_image_url || fallbackFeaturedImage || BLOG_PLACEHOLDER_IMAGE}
          alt={post.featured_image_alt || post.title}
          className="w-full h-full object-cover"
          onError={(e) => replaceWithBlogPlaceholder(e.currentTarget, blogImageContext)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container mx-auto px-4 pb-8 md:pb-12 max-w-3xl">
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors mb-4">
              <ArrowLeft className="h-4 w-4" /> All posts
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.1] mb-3">{post.title}</h1>
            <div className="flex items-center gap-3 text-white/50 text-sm">
              {post.published_at && <span>{format(new Date(post.published_at), "d MMMM yyyy")}</span>}
              {post.author && <span>· {post.author}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readingTime} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article body — centred, max 720px */}
      <article className="container mx-auto px-4 py-10 max-w-[720px]">
        {post.content && (
          <div
            ref={contentRef}
            className="prose prose-neutral dark:prose-invert max-w-none prose-lg prose-p:leading-relaxed prose-p:mb-6 prose-headings:font-display prose-headings:text-foreground prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        )}
      </article>

      {/* Related posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="bg-secondary/40 py-14">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display font-bold text-foreground mb-8">More Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/blog/${rp.slug}`}
                  className="group bg-card rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={rp.featured_image_url || BLOG_PLACEHOLDER_IMAGE}
                      alt={rp.featured_image_alt || rp.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 mb-1">
                      {rp.title}
                    </h3>
                    {rp.published_at && (
                      <p className="text-xs text-muted-foreground">{format(new Date(rp.published_at), "d MMMM yyyy")}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default BlogPostPage;
