
-- Drop the overly permissive page_views insert policy and replace with a more controlled one
DROP POLICY "Anyone can insert page views" ON public.page_views;

-- Allow inserts but restrict to only inserting with view_count = 1 (no manipulation)
CREATE POLICY "Track page views" ON public.page_views 
  FOR INSERT WITH CHECK (view_count = 1);
