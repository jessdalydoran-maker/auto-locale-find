
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS family_friendly boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS kids_friendly boolean NOT NULL DEFAULT false;
