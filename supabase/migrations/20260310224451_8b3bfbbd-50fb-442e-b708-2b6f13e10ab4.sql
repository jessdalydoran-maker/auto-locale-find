-- Fix: professional sports fixtures should not be marked family-friendly
-- Belfast Giants games and competitive sport events are not family activities
UPDATE events 
SET is_family_friendly = false 
WHERE title ILIKE '%Belfast Giants%'
  AND status = 'active';

-- Also fix events that are competitive sports tagged with 'family' generically
UPDATE events 
SET is_family_friendly = false 
WHERE status = 'active'
  AND is_family_friendly = true
  AND (
    title ILIKE '% vs %' 
    OR title ILIKE '% versus %'
    OR title ILIKE '%championship%'
    OR title ILIKE '%5K race%'
    OR title ILIKE '%10K race%'
    OR title ILIKE '%marathon%'
  )
  AND title NOT ILIKE '%kids%'
  AND title NOT ILIKE '%children%'
  AND title NOT ILIKE '%family fun%';

-- Remove 'family' from tags for Belfast Giants events  
UPDATE events 
SET tags = array_remove(tags, 'family')
WHERE title ILIKE '%Belfast Giants%'
  AND status = 'active';