
-- Add county column to cities for location hierarchy
ALTER TABLE cities ADD COLUMN IF NOT EXISTS county text;

-- Add age_groups array to listings for family age tagging
ALTER TABLE listings ADD COLUMN IF NOT EXISTS age_groups text[] DEFAULT '{}';

-- Add nearby_towns to cities for radius expansion
ALTER TABLE cities ADD COLUMN IF NOT EXISTS nearby_city_slugs text[] DEFAULT '{}';
