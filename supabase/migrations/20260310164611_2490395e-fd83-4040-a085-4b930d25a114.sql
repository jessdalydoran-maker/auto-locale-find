
-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  short_description text,
  date_start date NOT NULL,
  date_end date,
  time_start time,
  time_end time,
  venue_name text,
  venue_address text,
  city_id uuid REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  neighbourhood_id uuid REFERENCES public.neighbourhoods(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url text,
  ticket_url text,
  official_url text,
  price text,
  is_free boolean NOT NULL DEFAULT false,
  is_family_friendly boolean NOT NULL DEFAULT false,
  is_indoor boolean NOT NULL DEFAULT true,
  is_outdoor boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  tags text[] DEFAULT '{}',
  source_url text,
  source_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active events are publicly readable" ON public.events
  FOR SELECT TO public USING (status = 'active');

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraints for safe inserts
ALTER TABLE public.categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);
ALTER TABLE public.modifiers ADD CONSTRAINT modifiers_slug_unique UNIQUE (slug);
ALTER TABLE public.cities ADD CONSTRAINT cities_slug_unique UNIQUE (slug);
ALTER TABLE public.neighbourhoods ADD CONSTRAINT neighbourhoods_slug_city_unique UNIQUE (slug, city_id);
