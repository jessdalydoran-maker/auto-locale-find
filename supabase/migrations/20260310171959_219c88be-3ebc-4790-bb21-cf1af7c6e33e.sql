
-- Automation logs table
CREATE TABLE public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL DEFAULT 'weekly',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  listings_added integer DEFAULT 0,
  listings_updated integer DEFAULT 0,
  listings_archived integer DEFAULT 0,
  events_expired integer DEFAULT 0,
  pages_published integer DEFAULT 0,
  pages_unpublished integer DEFAULT 0,
  duplicates_merged integer DEFAULT 0,
  details jsonb DEFAULT '{}'::jsonb,
  error_message text
);

-- Automation settings table
CREATE TABLE public.automation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

-- Public read for logs and settings
CREATE POLICY "Automation logs are publicly readable" ON public.automation_logs FOR SELECT TO public USING (true);
CREATE POLICY "Automation settings are publicly readable" ON public.automation_settings FOR SELECT TO public USING (true);

-- Insert default settings
INSERT INTO public.automation_settings (key, value) VALUES
  ('automation_enabled', 'true'),
  ('content_threshold_category_city', '5'),
  ('content_threshold_modifier', '4'),
  ('content_threshold_neighbourhood', '3'),
  ('last_manual_run', ''),
  ('priority_city', 'belfast');

-- Add is_archived column to listings for soft-delete
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Update RLS policy for listings to exclude archived
DROP POLICY IF EXISTS "Approved listings are publicly readable" ON public.listings;
CREATE POLICY "Approved listings are publicly readable" ON public.listings FOR SELECT TO public USING (is_approved = true AND is_archived = false);
