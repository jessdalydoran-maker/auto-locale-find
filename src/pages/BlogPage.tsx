import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { setPageCanonical } from "@/lib/canonical";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BLOG_PLACEHOLDER_IMAGE, getBlogFallbackImage, replaceWithBlogPlaceholder } from "@/lib/blog-image-fallback";
import { ArrowRight } from "lucide-react";

const BlogPage = () => {
  useEffect(() => {
    document.title = "Blog & Guides | City Scout Guide";
    setPageCanonical("/blog");
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
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

  const featuredPost = posts?.[0];
  const otherPosts = posts?.slice(1);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-primary-foreground">Guides & Insights</h1>
          <p className="text-primary-foreground/60 mt-3 max-w-lg mx-auto">
            Local tips, curated lists and insider knowledge for exploring Northern Ireland.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-32 w-48 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !posts?.length ? (
          <p className="text-muted-foreground text-center py-16">No posts yet — check back soon!</p>
        ) : (
          <>
            {/* Featured post — large card */}
            {featuredPost && (
              <Link
                to={`/blog/${featuredPost.slug}`}
                className="group block rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 mb-10"
              >
                <div className="relative aspect-[2/1] md:aspect-[5/2] overflow-hidden">
                  <img
                    src={featuredPost.featured_image_url || getBlogFallbackImage({ title: featuredPost.title }, featuredPost.featured_image_url) || BLOG_PLACEHOLDER_IMAGE}
                    alt={featuredPost.featured_image_alt || featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    onError={(e) => replaceWithBlogPlaceholder(e.currentTarget, { title: featuredPost.title })}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <span className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">Latest Guide</span>
                    <h2 className="font-display font-bold text-white text-2xl md:text-3xl mt-2 max-w-2xl leading-snug">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-white/60 text-sm mt-2 max-w-xl line-clamp-2">{featuredPost.excerpt}</p>
                    )}
                    <p className="text-white/40 text-xs mt-3">
                      {featuredPost.published_at ? format(new Date(featuredPost.published_at), "d MMMM yyyy") : ""}
                      {featuredPost.author ? ` · ${featuredPost.author}` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* Other posts grid */}
            {otherPosts && otherPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherPosts.map((post) => {
                  const ctx = { title: post.title, excerpt: post.excerpt };
                  return (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="group flex flex-col rounded-xl overflow-hidden bg-card card-shadow hover:card-shadow-hover transition-all duration-300"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={post.featured_image_url || getBlogFallbackImage(ctx, post.featured_image_url) || BLOG_PLACEHOLDER_IMAGE}
                          alt={post.featured_image_alt || post.title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => replaceWithBlogPlaceholder(e.currentTarget, ctx)}
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-accent transition-colors line-clamp-2 mb-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {post.published_at ? format(new Date(post.published_at), "d MMMM yyyy") : ""}
                          {post.author ? ` · ${post.author}` : ""}
                        </p>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
                        )}
                        <span className="text-sm text-accent font-semibold mt-3 flex items-center gap-1">
                          Read more <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default BlogPage;
