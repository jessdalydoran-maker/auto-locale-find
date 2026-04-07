
-- Cities: allow authenticated users to manage
CREATE POLICY "Authenticated users can insert cities" ON public.cities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cities" ON public.cities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete cities" ON public.cities FOR DELETE TO authenticated USING (true);

-- Categories: allow authenticated users to manage
CREATE POLICY "Authenticated users can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update categories" ON public.categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete categories" ON public.categories FOR DELETE TO authenticated USING (true);

-- Blog posts: allow authenticated users to update and delete
CREATE POLICY "Authenticated users can update blog posts" ON public.blog_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete blog posts" ON public.blog_posts FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all blog posts" ON public.blog_posts FOR SELECT TO authenticated USING (true);
