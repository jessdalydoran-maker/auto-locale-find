
-- Deep RiverRock 5K race
UPDATE events SET
  image_url = 'https://cihwaufcosofbgjuqrkk.supabase.co/storage/v1/object/public/venue-images/deep-riverrock-5k.jpg',
  image_source = 'manual',
  image_status = 'verified',
  image_alt = 'Runners in a 5K road race through a city park'
WHERE id = '49fa47e4-7106-49e7-adaa-114ea39dd335';

-- Beauty and the Beast Jnr
UPDATE events SET
  image_url = 'https://cihwaufcosofbgjuqrkk.supabase.co/storage/v1/object/public/venue-images/beauty-beast-stage.jpg',
  image_source = 'manual',
  image_status = 'verified',
  image_alt = 'Beauty and the Beast stage musical performance with Belle and Beast dancing'
WHERE id = '949e4807-0b8d-4c28-a14b-cc0bf87161a5';

-- Country to Country Festival
UPDATE events SET
  image_url = 'https://cihwaufcosofbgjuqrkk.supabase.co/storage/v1/object/public/venue-images/country-to-country.jpg',
  image_source = 'manual',
  image_status = 'verified',
  image_alt = 'Country music fans in cowboy hats at a live arena concert'
WHERE id = '1696eff4-5407-46f4-b0d9-47bdf2bf3da2';

-- OX Belfast
UPDATE listings SET
  image_url = 'https://cihwaufcosofbgjuqrkk.supabase.co/storage/v1/object/public/venue-images/ox-belfast.jpg',
  image_source = 'website',
  image_status = 'verified',
  image_alt = 'OX Belfast restaurant interior with elegant dining tables and floor-to-ceiling windows'
WHERE id = 'af10005c-fde4-4794-b71a-9705e2425bd2';
