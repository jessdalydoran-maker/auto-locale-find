
-- Add place_id and image metadata to listings
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS image_source text DEFAULT 'fallback',
  ADD COLUMN IF NOT EXISTS image_alt text;

-- Add image metadata to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_source text DEFAULT 'fallback',
  ADD COLUMN IF NOT EXISTS image_alt text;

-- Add image metadata to cities
ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS image_alt text;

-- Index for place_id lookups
CREATE INDEX IF NOT EXISTS idx_listings_place_id ON public.listings(place_id) WHERE place_id IS NOT NULL;
