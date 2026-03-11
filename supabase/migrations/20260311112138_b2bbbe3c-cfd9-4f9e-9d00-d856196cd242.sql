
UPDATE listings
SET image_url = 'https://cihwaufcosofbgjuqrkk.supabase.co/storage/v1/object/public/venue-images/st-georges-market.jpeg',
    image_source = 'manual',
    image_status = 'verified',
    image_alt = 'St George''s Market Belfast - historic red brick Victorian market building entrance'
WHERE slug ILIKE '%st-george%market%' OR name ILIKE '%St George%Market%';

UPDATE events
SET image_url = 'https://cihwaufcosofbgjuqrkk.supabase.co/storage/v1/object/public/venue-images/st-georges-market.jpeg',
    image_source = 'manual',
    image_status = 'verified',
    image_alt = 'St George''s Market Belfast - historic red brick Victorian market building entrance'
WHERE venue_name ILIKE '%St George%Market%';
