
UPDATE events SET
  image_url = 'https://cihwaufcosofbgjuqrkk.supabase.co/storage/v1/object/public/venue-images/sparkher-series.jpg',
  image_source = 'manual',
  image_status = 'verified',
  image_alt = 'Women walking together in a park at twilight as part of a community wellness event'
WHERE id IN (
  '07ad1b1a-08c4-41d4-bab6-240ec96eb04d',
  '911e3424-a85a-4faa-9922-6dfcf73a40c6',
  '6eefc3dd-8de7-4bc0-b052-da2bb4b1cf70',
  '76b604a5-9bac-4627-918f-15764b99b4ac'
);
