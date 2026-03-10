
CREATE TABLE public.event_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'venue',
  website_url text,
  events_url text,
  city_id uuid REFERENCES public.cities(id),
  tags text[] DEFAULT '{}',
  priority integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  last_scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event sources are publicly readable"
ON public.event_sources
FOR SELECT
TO public
USING (true);
