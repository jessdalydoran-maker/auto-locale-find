
-- Add Shopping & Leisure categories
INSERT INTO categories (name, slug, icon, description, is_active) VALUES
  ('Shopping', 'shopping', 'ShoppingBag', 'Shopping centres, retail parks and outlets across Northern Ireland', true),
  ('Leisure & Entertainment', 'leisure-entertainment', 'Gamepad2', 'Bowling, trampoline parks, soft play, activity centres and family entertainment', true)
ON CONFLICT DO NOTHING;

-- Now seed real venues for smaller towns
-- Using known category IDs and city IDs from the queries above

-- ANTRIM (city_id: 51827eba-90b1-4c93-8d26-fd3d5511e53e)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('The Junction Retail & Leisure Park', 'the-junction-retail-leisure-park-antrim', '51827eba-90b1-4c93-8d26-fd3d5511e53e', (SELECT id FROM categories WHERE slug='shopping'), 'Major retail and leisure park in Antrim with high street brands, restaurants and a cinema.', 'Antrim, BT41 4LL', true, false, true, true),
  ('Antrim Castle Gardens', 'antrim-castle-gardens', '51827eba-90b1-4c93-8d26-fd3d5511e53e', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Award-winning heritage gardens with a 400-year history, play park and walking trails.', 'Randalstown Road, Antrim, BT41 4LH', true, false, true, true),
  ('Antrim Forum', 'antrim-forum', '51827eba-90b1-4c93-8d26-fd3d5511e53e', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Public leisure centre with swimming pool, gym, sports halls and fitness classes.', 'Lough Road, Antrim, BT41 4DQ', true, false, true, true),
  ('Omniplex Cinema Antrim', 'omniplex-cinema-antrim', '51827eba-90b1-4c93-8d26-fd3d5511e53e', '50ff6725-e0ed-4937-a510-8920f1775cf6', 'Multi-screen cinema at The Junction showing the latest blockbusters and family films.', 'The Junction, Antrim, BT41 4LL', true, false, true, true),
  ('Allen Park', 'allen-park-antrim', '51827eba-90b1-4c93-8d26-fd3d5511e53e', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Popular local park with walking paths, play areas, pitch and putt, and wildlife pond.', 'Castle Road, Antrim', true, false, true, true)
ON CONFLICT DO NOTHING;

-- BALLYMENA (city_id: 0e4a65ca-ff60-4c2c-9501-a5085a4517cc)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Fairhill Shopping Centre', 'fairhill-shopping-centre-ballymena', '0e4a65ca-ff60-4c2c-9501-a5085a4517cc', (SELECT id FROM categories WHERE slug='shopping'), 'Ballymena''s largest shopping centre with major retailers, food court and free parking.', 'Fairhill, Ballymena, BT43 6UF', true, false, true, true),
  ('Tower Centre', 'tower-centre-ballymena', '0e4a65ca-ff60-4c2c-9501-a5085a4517cc', (SELECT id FROM categories WHERE slug='shopping'), 'Covered town centre shopping mall with high street stores, cafes and services.', 'Wellington Street, Ballymena, BT43 6AH', true, false, true, true),
  ('Seven Towers Leisure Centre', 'seven-towers-leisure-centre-ballymena', '0e4a65ca-ff60-4c2c-9501-a5085a4517cc', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Modern leisure complex with swimming pool, gym, fitness studio and sports courts.', 'Trostan Avenue, Ballymena, BT43 7BL', true, false, true, true),
  ('Omniplex Cinema Ballymena', 'omniplex-cinema-ballymena', '0e4a65ca-ff60-4c2c-9501-a5085a4517cc', '50ff6725-e0ed-4937-a510-8920f1775cf6', 'Multi-screen cinema showing the latest releases and family films in Ballymena.', 'Larne Road Link, Ballymena, BT42 3FA', true, false, true, true),
  ('Ecos Nature Park', 'ecos-nature-park-ballymena', '0e4a65ca-ff60-4c2c-9501-a5085a4517cc', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Environmental centre with 150 acres of parkland, interactive exhibits, play areas and walking trails.', 'Broughshane Road, Ballymena, BT43 7QA', true, false, true, true)
ON CONFLICT DO NOTHING;

-- COLERAINE (city_id: ecbd3b49-21c7-4c63-9d4a-9e085885a1e3)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Riverside Retail Park Coleraine', 'riverside-retail-park-coleraine', 'ecbd3b49-21c7-4c63-9d4a-9e085885a1e3', (SELECT id FROM categories WHERE slug='shopping'), 'Retail park with major stores including Next, TK Maxx and Currys on the edge of Coleraine.', 'Riverside Retail Park, Coleraine, BT51 3EZ', true, false, true, true),
  ('Jet Centre Coleraine', 'jet-centre-coleraine', 'ecbd3b49-21c7-4c63-9d4a-9e085885a1e3', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Indoor activity centre with bowling, soft play, arcades and laser tag for all ages.', 'Coleraine, BT51 3QY', true, false, true, true),
  ('Coleraine Leisure Centre', 'coleraine-leisure-centre', 'ecbd3b49-21c7-4c63-9d4a-9e085885a1e3', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Public leisure centre with 25m pool, gym, fitness classes and sports halls.', 'Railway Road, Coleraine, BT52 1PE', true, false, true, true),
  ('Diamond Centre Coleraine', 'diamond-centre-coleraine', 'ecbd3b49-21c7-4c63-9d4a-9e085885a1e3', (SELECT id FROM categories WHERE slug='shopping'), 'Town centre shopping arcade with local retailers and cafes around The Diamond.', 'The Diamond, Coleraine, BT52 1AA', true, false, true, true),
  ('Mountsandel Fort', 'mountsandel-fort-coleraine', 'ecbd3b49-21c7-4c63-9d4a-9e085885a1e3', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'One of the earliest known settlements in Ireland, dating back 9,000 years, with riverside walks.', 'Mountsandel Road, Coleraine', true, false, true, true)
ON CONFLICT DO NOTHING;

-- COOKSTOWN (city_id: 0d198782-dc69-4897-8261-e6b83220f5d5)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Burnavon Arts & Cultural Centre', 'burnavon-arts-cultural-centre-cookstown', '0d198782-dc69-4897-8261-e6b83220f5d5', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Arts and cultural venue hosting theatre, comedy, live music and exhibitions in the heart of Cookstown.', 'Burn Road, Cookstown, BT80 8DN', true, false, true, true),
  ('Cookstown Leisure Centre', 'cookstown-leisure-centre', '0d198782-dc69-4897-8261-e6b83220f5d5', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Modern leisure centre with swimming pool, gym, fitness classes and soft play area.', 'Fountain Road, Cookstown, BT80 8QF', true, false, true, true),
  ('Tesco Extra Cookstown', 'tesco-extra-cookstown', '0d198782-dc69-4897-8261-e6b83220f5d5', (SELECT id FROM categories WHERE slug='shopping'), 'Large superstore and one of the main retail anchors in Cookstown with cafes nearby.', 'Orritor Road, Cookstown', true, false, true, false),
  ('Drum Manor Forest Park', 'drum-manor-forest-park-cookstown', '0d198782-dc69-4897-8261-e6b83220f5d5', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Beautiful forest park with butterfly garden, walled garden, play park and scenic walking trails.', 'Drum Road, Cookstown, BT80 9RT', true, false, true, true),
  ('Wellbrook Beetling Mill', 'wellbrook-beetling-mill-cookstown', '0d198782-dc69-4897-8261-e6b83220f5d5', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'National Trust-managed 18th century water-powered linen mill set in scenic woodland.', 'Wellbrook Road, Cookstown', true, false, true, true)
ON CONFLICT DO NOTHING;

-- OMAGH (city_id: c4431903-fe81-41b7-ac3b-4f68d24a9a03)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Strule Arts Centre', 'strule-arts-centre-omagh', 'c4431903-fe81-41b7-ac3b-4f68d24a9a03', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Multi-purpose arts venue with theatre, cinema, gallery and creative workshops in Omagh town centre.', 'Townhall Square, Omagh, BT78 1BL', true, false, true, true),
  ('Omniplex Cinema Omagh', 'omniplex-cinema-omagh', 'c4431903-fe81-41b7-ac3b-4f68d24a9a03', '50ff6725-e0ed-4937-a510-8920f1775cf6', 'Multi-screen cinema showing the latest blockbusters and family films in Omagh.', 'Drumragh Avenue, Omagh, BT78 1SL', true, false, true, true),
  ('Omagh Leisure Complex', 'omagh-leisure-complex', 'c4431903-fe81-41b7-ac3b-4f68d24a9a03', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Modern leisure complex with swimming pool, waterslides, gym, fitness studios and soft play.', 'Old Mountfield Road, Omagh', true, false, true, true),
  ('Ulster American Folk Park', 'ulster-american-folk-park-omagh', 'c4431903-fe81-41b7-ac3b-4f68d24a9a03', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Award-winning open-air museum telling the story of emigration from Ulster to America with costumed characters.', 'Mellon Road, Castletown, Omagh, BT78 5QU', true, false, true, true),
  ('Gortin Glen Forest Park', 'gortin-glen-forest-park-omagh', 'c4431903-fe81-41b7-ac3b-4f68d24a9a03', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Stunning forest park in the Sperrins with scenic drive, walking trails, mountain biking and deer enclosure.', 'Gortin, Omagh, BT79 8NB', true, false, true, true)
ON CONFLICT DO NOTHING;

-- NEWRY (city_id: d9f088a5-81f7-4eb3-8b63-0e7c4ec1a5ee)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Buttercrane Shopping Centre', 'buttercrane-shopping-centre-newry', 'd9f088a5-81f7-4eb3-8b63-0e7c4ec1a5ee', (SELECT id FROM categories WHERE slug='shopping'), 'Major shopping centre with over 50 stores, food court and free parking in Newry city centre.', 'Buttercrane Quay, Newry, BT35 8HJ', true, false, true, true),
  ('The Quays Shopping Centre', 'the-quays-shopping-centre-newry', 'd9f088a5-81f7-4eb3-8b63-0e7c4ec1a5ee', (SELECT id FROM categories WHERE slug='shopping'), 'Canalside shopping and entertainment centre with restaurants, bowling and cinema.', 'Albert Basin, Newry, BT35 8BQ', true, false, true, true),
  ('Omniplex Cinema Newry', 'omniplex-cinema-newry', 'd9f088a5-81f7-4eb3-8b63-0e7c4ec1a5ee', '50ff6725-e0ed-4937-a510-8920f1775cf6', 'Multi-screen cinema at The Quays showing the latest films and family screenings.', 'The Quays, Albert Basin, Newry', true, false, true, true),
  ('Newry Leisure Centre', 'newry-leisure-centre', 'd9f088a5-81f7-4eb3-8b63-0e7c4ec1a5ee', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Modern leisure facility with pool, gym, sports courts and group fitness classes.', 'Cecil Street, Newry', true, false, true, true),
  ('Slieve Gullion Forest Park', 'slieve-gullion-forest-park-newry', 'd9f088a5-81f7-4eb3-8b63-0e7c4ec1a5ee', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Scenic forest park with adventure playpark, Giant''s Lair story trail and panoramic summit views.', 'Meigh Road, Newry, BT35 8SW', true, false, true, true)
ON CONFLICT DO NOTHING;

-- CRAIGAVON (city_id: 8e3610e7-4a8f-4a72-add1-5ee8f457c3e6)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Rushmere Shopping Centre', 'rushmere-shopping-centre-craigavon', '8e3610e7-4a8f-4a72-add1-5ee8f457c3e6', (SELECT id FROM categories WHERE slug='shopping'), 'One of Northern Ireland''s largest shopping centres with major retailers, restaurants and cinema.', 'Marlborough Retail Park, Craigavon, BT64 1AA', true, false, true, true),
  ('Craigavon Leisure Centre', 'craigavon-leisure-centre', '8e3610e7-4a8f-4a72-add1-5ee8f457c3e6', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Large public leisure complex with swimming, gym, sports halls, bowling and soft play.', 'Brownlow Road, Craigavon, BT65 5DL', true, false, true, true),
  ('Airtastic Craigavon', 'airtastic-craigavon', '8e3610e7-4a8f-4a72-add1-5ee8f457c3e6', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Family entertainment centre with trampolines, bowling, climbing walls, VR and soft play.', 'Rushmere Shopping Centre, Craigavon', true, false, true, true),
  ('Omniplex Cinema Craigavon', 'omniplex-cinema-craigavon', '8e3610e7-4a8f-4a72-add1-5ee8f457c3e6', '50ff6725-e0ed-4937-a510-8920f1775cf6', 'Multi-screen cinema at Rushmere showing the latest blockbusters and family films.', 'Rushmere, Craigavon', true, false, true, true),
  ('Craigavon City Park & Lakes', 'craigavon-city-park-lakes', '8e3610e7-4a8f-4a72-add1-5ee8f457c3e6', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Expansive lakeside park with watersports, cycling trails, play areas and nature walks.', 'Craigavon, BT64 1AS', true, false, true, true)
ON CONFLICT DO NOTHING;

-- BANGOR (city_id: fc61418e-d314-4ff4-be14-366a0d80f66f)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Bloomfield Shopping Centre', 'bloomfield-shopping-centre-bangor', 'fc61418e-d314-4ff4-be14-366a0d80f66f', (SELECT id FROM categories WHERE slug='shopping'), 'Town centre shopping mall with Primark, Next, Boots and other high street retailers.', 'South Circular Road, Bangor, BT19 7HB', true, false, true, true),
  ('Pickie Fun Park', 'pickie-fun-park-bangor', 'fc61418e-d314-4ff4-be14-366a0d80f66f', '7ed18efb-7470-4a71-9cfb-1a194cdaf5cf', 'Free seafront fun park with swan pedalos, mini golf, splash pad and play areas on Bangor seafront.', 'Marine Gardens, Bangor, BT20 5AG', true, false, true, true),
  ('Bangor Aurora Aquatic & Leisure Complex', 'bangor-aurora-leisure-complex', 'fc61418e-d314-4ff4-be14-366a0d80f66f', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Modern leisure complex with 25m pool, wave pool, waterslides, gym and fitness classes.', 'Palace Park, Bangor, BT20 4TB', true, false, true, true),
  ('Bangor Castle Walled Garden', 'bangor-castle-walled-garden', 'fc61418e-d314-4ff4-be14-366a0d80f66f', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Beautiful Victorian walled garden with formal planting, sensory garden and woodland walks.', 'Castle Park, Bangor, BT20 4SJ', true, false, true, true),
  ('North Down Museum', 'north-down-museum-bangor', 'fc61418e-d314-4ff4-be14-366a0d80f66f', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Free museum exploring the history of North Down from ancient times to the present day.', 'Town Hall, Castle Park Avenue, Bangor, BT20 4BT', true, false, true, true)
ON CONFLICT DO NOTHING;

-- LISBURN (city_id: 62fd6edb-95d7-4803-9b1e-b850e1335fc8)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Lisburn Leisureplex', 'lisburn-leisureplex', '62fd6edb-95d7-4803-9b1e-b850e1335fc8', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Popular leisure centre with swimming pool, gym, bowling, soft play and fitness classes.', 'Governors Road, Lisburn, BT28 1LP', true, false, true, true),
  ('Bow Street Mall', 'bow-street-mall-lisburn', '62fd6edb-95d7-4803-9b1e-b850e1335fc8', (SELECT id FROM categories WHERE slug='shopping'), 'Lisburn''s main town centre shopping mall with major retailers, cafes and services.', 'Bow Street, Lisburn, BT28 1BN', true, false, true, true),
  ('Sprucefield Retail Park', 'sprucefield-retail-park-lisburn', '62fd6edb-95d7-4803-9b1e-b850e1335fc8', (SELECT id FROM categories WHERE slug='shopping'), 'Large retail park on the M1 corridor with Marks & Spencer, Sainsbury''s and homeware stores.', 'Sprucefield, Lisburn, BT27 5UE', true, false, true, true),
  ('Omniplex Cinema Lisburn', 'omniplex-cinema-lisburn', '62fd6edb-95d7-4803-9b1e-b850e1335fc8', '50ff6725-e0ed-4937-a510-8920f1775cf6', 'Multi-screen cinema in Lisburn Leisureplex showing the latest blockbusters.', 'Governors Road, Lisburn, BT28 1LP', true, false, true, true),
  ('Irish Linen Centre & Lisburn Museum', 'irish-linen-centre-lisburn-museum', '62fd6edb-95d7-4803-9b1e-b850e1335fc8', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Free museum celebrating Lisburn''s linen heritage with interactive exhibits and local history.', 'Market Square, Lisburn, BT28 1AG', true, false, true, true)
ON CONFLICT DO NOTHING;

-- NEWTOWNABBEY (city_id: 73b90cca-ccdb-4244-9b6c-a4aef7e6acc8)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Abbey Centre', 'abbey-centre-newtownabbey', '73b90cca-ccdb-4244-9b6c-a4aef7e6acc8', (SELECT id FROM categories WHERE slug='shopping'), 'Major shopping centre with Tesco, Marks & Spencer, Boots and a range of retailers and cafes.', 'Longwood Road, Newtownabbey, BT37 9UH', true, false, true, true),
  ('Valley Leisure Centre', 'valley-leisure-centre-newtownabbey', '73b90cca-ccdb-4244-9b6c-a4aef7e6acc8', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Public leisure centre with pool, gym, sports courts and fitness programmes.', 'Church Road, Newtownabbey, BT36 7LJ', true, false, true, true),
  ('Airtastic Newtownabbey', 'airtastic-newtownabbey', '73b90cca-ccdb-4244-9b6c-a4aef7e6acc8', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Family entertainment centre with trampolines, bowling, climbing and soft play.', 'Longwood Road, Newtownabbey', true, false, true, true),
  ('We Are Vertigo', 'we-are-vertigo-newtownabbey', '73b90cca-ccdb-4244-9b6c-a4aef7e6acc8', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Northern Ireland''s biggest indoor adventure centre with trampolines, ninja course, zip lines and climbing.', 'International Business Park, Newtownabbey, BT36 4TY', true, false, true, true),
  ('Hazelbank Park', 'hazelbank-park-newtownabbey', '73b90cca-ccdb-4244-9b6c-a4aef7e6acc8', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Scenic park on Belfast Lough shore with play areas, walking paths and views across the water.', 'Shore Road, Newtownabbey, BT37 0QB', true, false, true, true)
ON CONFLICT DO NOTHING;

-- DOWNPATRICK (city_id: e44abc91-46e5-43be-85b8-5310796dec8b)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Down County Museum', 'down-county-museum-downpatrick', 'e44abc91-46e5-43be-85b8-5310796dec8b', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Free museum in the old county gaol exploring the heritage and history of County Down.', 'The Mall, Downpatrick, BT30 6AH', true, false, true, true),
  ('Saint Patrick Centre', 'saint-patrick-centre-downpatrick', 'e44abc91-46e5-43be-85b8-5310796dec8b', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Interactive exhibition telling the story of Ireland''s patron saint in his final resting place.', 'Market Street, Downpatrick, BT30 6LZ', true, false, true, true),
  ('Downpatrick & County Down Railway', 'downpatrick-railway', 'e44abc91-46e5-43be-85b8-5310796dec8b', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Heritage railway offering scenic rides through the countryside on restored steam and diesel trains.', 'Market Street, Downpatrick, BT30 6LZ', true, false, true, true),
  ('Downshire Retail Park', 'downshire-retail-park-downpatrick', 'e44abc91-46e5-43be-85b8-5310796dec8b', (SELECT id FROM categories WHERE slug='shopping'), 'Retail park with Lidl, Argos and local stores serving the Downpatrick area.', 'Market Street, Downpatrick', true, false, true, false),
  ('Inch Abbey', 'inch-abbey-downpatrick', 'e44abc91-46e5-43be-85b8-5310796dec8b', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Atmospheric 12th century Cistercian abbey ruins set on the banks of the River Quoile.', 'Inch Abbey Road, Downpatrick', true, false, true, true)
ON CONFLICT DO NOTHING;

-- STRABANE (city_id: 265cebd2-116c-448a-b753-4ea1329e33d5)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('Strabane Lifford Leisure Centre', 'strabane-leisure-centre', '265cebd2-116c-448a-b753-4ea1329e33d5', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Cross-border leisure facility with swimming pool, gym, sports hall and fitness classes.', 'Dock Road, Strabane, BT82 9EA', true, false, true, true),
  ('The Alley Theatre & Conference Centre', 'alley-theatre-strabane', '265cebd2-116c-448a-b753-4ea1329e33d5', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Arts venue hosting theatre, cinema screenings, comedy, live music and community events.', 'Railway Street, Strabane, BT82 8EF', true, false, true, true),
  ('Gray''s Printing Press', 'grays-printing-press-strabane', '265cebd2-116c-448a-b753-4ea1329e33d5', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'National Trust heritage site where John Dunlap, printer of the American Declaration of Independence, learned his trade.', 'Main Street, Strabane', true, false, true, true),
  ('Sion Mills Village', 'sion-mills-village-strabane', '265cebd2-116c-448a-b753-4ea1329e33d5', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Charming model village near Strabane with riverside walks and Victorian architecture.', 'Sion Mills, Strabane', true, false, true, true),
  ('Harry Avery''s Castle', 'harry-averys-castle-strabane', '265cebd2-116c-448a-b753-4ea1329e33d5', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Rare surviving Gaelic stone castle from the 14th century with panoramic hillside views.', 'Newtownstewart, Strabane', true, false, true, true)
ON CONFLICT DO NOTHING;

-- BANBRIDGE (city_id: 8b02e8ac-4c28-4eee-9733-2714e2ef4dfe)
INSERT INTO listings (name, slug, city_id, category_id, short_description, address, is_approved, is_archived, family_friendly, kids_friendly) VALUES
  ('The Outlet Banbridge', 'the-outlet-banbridge', '8b02e8ac-4c28-4eee-9733-2714e2ef4dfe', (SELECT id FROM categories WHERE slug='shopping'), 'Designer outlet shopping village with premium brands at discounted prices plus restaurants.', 'The Boulevard, Banbridge, BT32 4LB', true, false, true, true),
  ('Banbridge Leisure Centre', 'banbridge-leisure-centre', '8b02e8ac-4c28-4eee-9733-2714e2ef4dfe', (SELECT id FROM categories WHERE slug='leisure-entertainment'), 'Modern leisure centre with swimming pool, gym, sports courts and fitness classes.', 'Downshire Road, Banbridge, BT32 3JY', true, false, true, true),
  ('Solitude Park Banbridge', 'solitude-park-banbridge', '8b02e8ac-4c28-4eee-9733-2714e2ef4dfe', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Riverside park with play areas, walking trails and scenic grounds in the centre of Banbridge.', 'Newry Road, Banbridge', true, false, true, true),
  ('F.E. McWilliam Gallery', 'fe-mcwilliam-gallery-banbridge', '8b02e8ac-4c28-4eee-9733-2714e2ef4dfe', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Free art gallery and studio dedicated to sculptor F.E. McWilliam with rotating exhibitions.', 'Newry Road, Banbridge, BT32 3NB', true, false, true, true),
  ('Brontë Homeland Centre', 'bronte-homeland-centre-banbridge', '8b02e8ac-4c28-4eee-9733-2714e2ef4dfe', 'd539ae63-c3bb-47aa-9a5f-ea47de3f2958', 'Interpretive centre and heritage trail celebrating the Brontë family''s ancestral roots in County Down.', 'Drumballyroney, Banbridge', true, false, true, true)
ON CONFLICT DO NOTHING;
