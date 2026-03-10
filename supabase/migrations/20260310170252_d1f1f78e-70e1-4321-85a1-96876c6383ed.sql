
-- Add unique constraints to prevent duplicate listings and events
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_place_id_unique ON public.listings(place_id) WHERE place_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_slug_city ON public.listings(slug, city_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug_unique ON public.events(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_source_id_unique ON public.events(source_id) WHERE source_id IS NOT NULL;

-- Create a function to expire old events automatically
CREATE OR REPLACE FUNCTION public.expire_old_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE events
  SET status = 'expired'
  WHERE status = 'active'
    AND COALESCE(date_end, date_start) < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Create a table to track page content quality/publishing eligibility
CREATE TABLE IF NOT EXISTS public.page_quality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  content_count integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  canonical_slug text,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_quality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page quality is publicly readable"
ON public.page_quality FOR SELECT TO public
USING (true);
