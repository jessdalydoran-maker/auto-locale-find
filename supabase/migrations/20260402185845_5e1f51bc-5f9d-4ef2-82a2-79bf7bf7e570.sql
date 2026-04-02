
CREATE POLICY "Allow anon insert" ON blog_posts FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon select" ON blog_posts FOR SELECT TO anon USING (true);
