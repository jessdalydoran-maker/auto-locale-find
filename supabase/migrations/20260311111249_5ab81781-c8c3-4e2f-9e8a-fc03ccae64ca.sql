
-- Add is_event_venue flag to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_event_venue boolean NOT NULL DEFAULT false;

-- Add venue_listing_id to events to link events to host venues
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_listing_id uuid REFERENCES listings(id) ON DELETE SET NULL;

-- Tag existing event venues
UPDATE listings SET is_event_venue = true WHERE id IN (
  'f030d9b1-0c55-4d21-bae5-b32990148b19', -- St George's Market Belfast
  '36c7cfaf-ae9b-4fb1-aa6f-fdf4ca258da9', -- St George's Market (dupe)
  'd83f6c5a-b0c8-44db-80d5-ecdd55edf328', -- The Junction Antrim
  '0b591e8b-4e29-4850-91b4-009976d673fd', -- Junction One Antrim
  '5fb1ee8f-b6e6-43d5-af08-e6c7363efe4c', -- Strule Arts Centre Omagh
  'a9b76542-db05-4b17-bd03-73dca0a72746', -- Antrim Forum
  '68a9ec5c-fe9a-4179-8318-b5de0e926f93'  -- Antrim Forum Leisure Centre
);

-- Also tag any listings in the Markets category as event venues
UPDATE listings SET is_event_venue = true WHERE category_id = 'db5a5660-206c-45a7-acf1-e370c552310f';

-- Seed recurring market events for St George's Market
INSERT INTO events (title, slug, city_id, venue_name, venue_address, date_start, date_end, time_start, time_end, description, short_description, status, is_free, is_family_friendly, is_indoor, tags, category_id, venue_listing_id, image_source, image_status) VALUES
  ('St George''s Market Friday Variety Market', 'st-georges-market-friday-variety-market-2026-03-13', '42348796-902b-4135-80ff-8c49207aef77', 'St George''s Market', 'East Bridge Street, Belfast, BT1 3NQ', '2026-03-13', '2026-03-13', '06:00', '14:00', 'Belfast''s famous Friday Variety Market features fresh fish, flowers, clothing, antiques, books and local produce. A vibrant Belfast tradition since 1890.', 'Weekly variety market with fresh produce, flowers, antiques and local goods.', 'active', true, true, true, ARRAY['market','food','artisan','family','free'], 'db5a5660-206c-45a7-acf1-e370c552310f', 'f030d9b1-0c55-4d21-bae5-b32990148b19', 'fallback', 'needs_review'),
  
  ('St George''s Market Saturday City Food & Craft Market', 'st-georges-market-saturday-food-craft-2026-03-14', '42348796-902b-4135-80ff-8c49207aef77', 'St George''s Market', 'East Bridge Street, Belfast, BT1 3NQ', '2026-03-14', '2026-03-14', '09:00', '15:00', 'Saturday at St George''s Market is all about local and international food, crafts, and live music. Sample street food from around the world and browse handmade crafts.', 'Food and craft market with street food, artisan goods and live music.', 'active', true, true, true, ARRAY['market','food','craft','artisan','family','free','live-music'], 'db5a5660-206c-45a7-acf1-e370c552310f', 'f030d9b1-0c55-4d21-bae5-b32990148b19', 'fallback', 'needs_review'),
  
  ('St George''s Market Sunday Food, Art & Craft Market', 'st-georges-market-sunday-food-art-2026-03-15', '42348796-902b-4135-80ff-8c49207aef77', 'St George''s Market', 'East Bridge Street, Belfast, BT1 3NQ', '2026-03-15', '2026-03-15', '10:00', '16:00', 'The Sunday Market is the newest addition to St George''s, featuring local art, antiques, crafts, and a fantastic food hall with live entertainment.', 'Sunday market with local art, antiques, food and live entertainment.', 'active', true, true, true, ARRAY['market','food','art','craft','artisan','family','free','live-music'], 'db5a5660-206c-45a7-acf1-e370c552310f', 'f030d9b1-0c55-4d21-bae5-b32990148b19', 'fallback', 'needs_review'),

  -- Junction Antrim family events
  ('Family Fun Day at The Junction', 'family-fun-day-junction-antrim-2026-03-22', '51827eba-90b1-4c93-8d26-fd3d5511e53e', 'The Junction Retail & Leisure Park', 'Antrim, BT41 4LL', '2026-03-22', '2026-03-22', '11:00', '16:00', 'Free family fun day at The Junction with face painting, bouncy castles, live entertainment and special retail offers.', 'Free family fun day with entertainment, activities and special offers.', 'active', true, true, false, ARRAY['family','kids','free','entertainment'], '7ed18efb-7470-4a71-9cfb-1a194cdaf5cf', 'd83f6c5a-b0c8-44db-80d5-ecdd55edf328', 'fallback', 'needs_review'),

  -- Artisan market events
  ('Belfast Artisan Market at St George''s', 'belfast-artisan-market-st-georges-2026-03-20', '42348796-902b-4135-80ff-8c49207aef77', 'St George''s Market', 'East Bridge Street, Belfast, BT1 3NQ', '2026-03-20', '2026-03-20', '10:00', '16:00', 'Special artisan market showcasing local makers, independent food producers, and craft workshops. Meet the makers behind Northern Ireland''s best artisan products.', 'Special artisan market with local makers, food producers and craft workshops.', 'active', true, true, true, ARRAY['market','artisan','craft','food','family','free'], 'db5a5660-206c-45a7-acf1-e370c552310f', 'f030d9b1-0c55-4d21-bae5-b32990148b19', 'fallback', 'needs_review')
ON CONFLICT DO NOTHING;
