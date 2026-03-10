
-- Create landmarks table
CREATE TABLE public.landmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city_id uuid REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  description text,
  radius_km double precision NOT NULL DEFAULT 1.5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Landmarks are publicly readable"
  ON public.landmarks FOR SELECT
  TO public
  USING (is_active = true);

-- Create distance function for haversine calculation
CREATE OR REPLACE FUNCTION public.nearby_listings(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 1.5,
  p_category_slug text DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS SETOF public.listings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.listings l
  JOIN public.categories c ON l.category_id = c.id
  WHERE l.is_approved = true
    AND l.is_archived = false
    AND l.latitude IS NOT NULL
    AND l.longitude IS NOT NULL
    AND (p_category_slug IS NULL OR c.slug = p_category_slug)
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(l.latitude))
        * cos(radians(l.longitude) - radians(p_lng))
        + sin(radians(p_lat)) * sin(radians(l.latitude))
      )
    ) <= p_radius_km
  ORDER BY
    (6371 * acos(
      cos(radians(p_lat)) * cos(radians(l.latitude))
      * cos(radians(l.longitude) - radians(p_lng))
      + sin(radians(p_lat)) * sin(radians(l.latitude))
    )) ASC
  LIMIT p_limit;
$$;
