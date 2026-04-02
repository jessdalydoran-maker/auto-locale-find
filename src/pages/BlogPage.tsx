import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { setPageCanonical, getCanonicalUrl } from "@/lib/canonical";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BLOG_PLACEHOLDER_IMAGE, replaceWithBlogPlaceholder } from "@/lib/blog-image-fallback";

const BlogPage = () => {
  useEffect(() => {
    document.title = "Blog | City Scout Guide";
    setPageCanonical("/blog");

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = "Guides, tips and local insights for exploring Northern Ireland – from hidden gems to weekend plans.";
  }, []);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, featured_image_alt, published_at, author")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Blog</h1>
        <p className="text-muted-foreground mb-8">
          Guides, tips and local insights for exploring Northern Ireland.
        </p>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-32 w-48 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !posts?.length ? (
          <p className="text-muted-foreground text-center py-16">
            No posts yet — check back soon!
          </p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all"
              >
                <img
                  src={post.featured_image_url || BLOG_PLACEHOLDER_IMAGE}
                  alt={post.featured_image_alt || `${post.title} featured image`}
                  className="w-full sm:w-48 h-32 object-cover rounded-lg shrink-0"
                  loading="lazy"
                  onError={(e) => replaceWithBlogPlaceholder(e.currentTarget)}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.published_at
                      ? format(new Date(post.published_at), "d MMMM yyyy")
                      : ""}
                    {post.author ? ` · ${post.author}` : ""}
                  </p>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BlogPage;
