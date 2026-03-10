-- Add council_area to events for proper NI-wide grouping
ALTER TABLE events ADD COLUMN IF NOT EXISTS council_area text;

-- Add council_area and county to event_sources for better metadata
ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS council_area text;
ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS town text;
ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS crawl_frequency text DEFAULT 'weekly';
ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS notes text;