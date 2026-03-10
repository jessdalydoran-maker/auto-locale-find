
-- Modifiers table for SEO patterns (best, cheap, romantic, etc.)
CREATE TABLE public.modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description_template text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modifiers are publicly readable"
  ON public.modifiers FOR SELECT TO public
  USING (true);

-- Neighbourhoods table
CREATE TABLE public.neighbourhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  description text,
  latitude double precision,
  longitude double precision,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(slug, city_id)
);

ALTER TABLE public.neighbourhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Neighbourhoods are publicly readable"
  ON public.neighbourhoods FOR SELECT TO public
  USING (true);

-- Add neighbourhood_id to listings (optional link)
ALTER TABLE public.listings ADD COLUMN neighbourhood_id uuid REFERENCES public.neighbourhoods(id);

-- Programmatic pages table to track generated pages
CREATE TABLE public.programmatic_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  modifier_id uuid REFERENCES public.modifiers(id),
  category_id uuid REFERENCES public.categories(id),
  city_id uuid REFERENCES public.cities(id),
  neighbourhood_id uuid REFERENCES public.neighbourhoods(id),
  title text NOT NULL,
  meta_description text,
  intro_text text,
  listing_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.programmatic_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Programmatic pages are publicly readable"
  ON public.programmatic_pages FOR SELECT TO public
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_programmatic_pages_updated_at
  BEFORE UPDATE ON public.programmatic_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
