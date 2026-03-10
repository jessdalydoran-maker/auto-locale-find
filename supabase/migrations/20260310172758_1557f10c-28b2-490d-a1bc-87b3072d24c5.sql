
-- Add image verification status to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_status text NOT NULL DEFAULT 'needs_review';
-- Valid values: 'verified', 'needs_review', 'placeholder'

-- Add image verification status to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_status text NOT NULL DEFAULT 'needs_review';
