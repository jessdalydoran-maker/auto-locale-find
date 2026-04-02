import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { setPageCanonical, getCanonicalUrl } from "@/lib/canonical";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

function setMetaTag(attr: string, key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function injectJsonLd(data: Record<string, unknown>) {
  const id = "blog-jsonld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug || "")
        .eq("status", "published")
        .maybeSingle();
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
    if (post.featured_image_url) {
      setMetaTag("property", "og:image", post.featured_image_url);
    }
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", post.title);
    setMetaTag("name", "twitter:description", desc);

    injectJsonLd({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: desc,
      image: post.featured_image_url || undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at || post.published_at,
      author: {
        "@type": "Organization",
        name: post.author || "City Scout Guide",
      },
      publisher: {
        "@type": "Organization",
        name: "City Scout Guide",
        url: "https://cityscoutguide.com",
      },
      mainEntityOfPage: getCanonicalUrl(`/blog/${post.slug}`),
    });

    return () => {
      const el = document.getElementById("blog-jsonld");
      el?.remove();
    };
  }, [post]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 max-w-3xl space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post not found</h1>
          <Link to="/blog" className="text-primary hover:underline">
            ← Back to blog
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container mx-auto px-4 py-10 max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          {post.title}
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          {post.published_at
            ? format(new Date(post.published_at), "d MMMM yyyy")
            : ""}
          {post.author ? ` · ${post.author}` : ""}
        </p>

        {post.featured_image_url && (
          <img
            src={post.featured_image_url}
            alt={post.featured_image_alt || post.title}
            className="w-full rounded-xl mb-8 object-cover max-h-[400px]"
          />
        )}

        {post.content && (
          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}
      </article>
    </Layout>
  );
};

export default BlogPostPage;
