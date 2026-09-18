INSERT INTO hotels (name, description, city, address, rating, image_url, amenities)
VALUES
  (
    'The Battery',
    'A full-service waterfront hotel with broad harbor views and a rooftop terrace.',
    'Charleston',
    '18 East Bay Street, Charleston, SC',
    4.9,
    '/images/battery-terrace.jpg',
    ARRAY['Rooftop terrace', 'Harbor dining', '24-hour concierge', 'Valet parking']
  ),
  (
    'The Calhoun',
    'A substantial city hotel centered on a quiet interior courtyard.',
    'Charleston',
    '212 Calhoun Street, Charleston, SC',
    4.7,
    '/images/calhoun-lobby.jpg',
    ARRAY['Interior courtyard', 'Signature restaurant', 'Valet parking', 'Fitness center']
  ),
  (
    'The Forsyth',
    'A destination hotel near the park with generous public rooms and measured service.',
    'Savannah',
    '10 West Gaston Street, Savannah, GA',
    4.8,
    '/images/calhoun-lobby.jpg',
    ARRAY['Park setting', 'Full-service dining', 'Concierge', 'Meeting rooms']
  ),
  (
    'The Aoyama',
    'A quiet, light-filled retreat on a tree-lined street in the Aoyama district.',
    'Tokyo',
    '4-1 Minamiaoyama, Minato City, Tokyo',
    4.8,
    '/images/aoyama-tokyo.jpg',
    ARRAY['Tea lounge', 'Cypress bath', '24-hour concierge', 'Valet parking']
  ),
  (
    'The Marunouchi',
    'A refined business-district hotel overlooking the Imperial Palace gardens.',
    'Tokyo',
    '2-4 Marunouchi, Chiyoda City, Tokyo',
    4.7,
    '/images/marunouchi-tokyo.jpg',
    ARRAY['Palace-view lounge', 'Executive floor', 'Fitness center', 'Valet parking']
  ),
  (
    'The Kamogawa',
    'A serene riverside hotel of timber and stone facing the Higashiyama hills.',
    'Kyoto',
    '405 Nanicho, Higashiyama Ward, Kyoto',
    4.9,
    '/images/kamogawa-kyoto.jpg',
    ARRAY['Riverside terrace', 'Kaiseki dining', 'Onsen bath', 'Garden courtyard']
  ),
  (
    'The Bund',
    'An art-deco waterfront hotel overlooking the Huangpu river and skyline.',
    'Shanghai',
    '20 Zhongshan East 1st Road, Huangpu, Shanghai',
    4.8,
    '/images/bund-shanghai.jpg',
    ARRAY['Riverfront terrace', 'Jazz bar', 'Fitness center', 'Valet parking']
  ),
  (
    'The Marais',
    'An intimate hotel set around a quiet courtyard in the historic Marais.',
    'Paris',
    '12 Rue de Sevigne, 75004 Paris',
    4.7,
    '/images/marais-paris.jpg',
    ARRAY['Courtyard garden', 'Wine cellar', 'Concierge', 'Champagne bar']
  ),
  (
    'The Gramercy',
    'An understated pre-war hotel facing a leafy private square in Manhattan.',
    'New York',
    '2 Lexington Avenue, New York, NY',
    4.8,
    '/images/gramercy-nyc.jpg',
    ARRAY['Private square access', 'Rooftop bar', 'Fitness center', 'Valet parking']
  )
ON CONFLICT (name, city) DO UPDATE SET
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  rating = EXCLUDED.rating,
  image_url = EXCLUDED.image_url,
  amenities = EXCLUDED.amenities,
  is_active = true;

INSERT INTO rooms (
  hotel_id,
  name,
  description,
  price_per_night,
  capacity,
  total_rooms
)
SELECT
  hotels.id,
  room_seed.name,
  room_seed.description,
  room_seed.price_per_night,
  room_seed.capacity,
  room_seed.total_rooms
FROM (
  VALUES
    ('The Battery', 'Charleston', 'Harbor View King', 'One king bed with a harbor-facing sitting area.', 465.00::numeric, 2, 8),
    ('The Battery', 'Charleston', 'Terrace Suite', 'A separate living room and private terrace above the harbor.', 695.00::numeric, 4, 3),
    ('The Calhoun', 'Charleston', 'Courtyard King', 'One king bed overlooking the interior courtyard.', 395.00::numeric, 2, 10),
    ('The Calhoun', 'Charleston', 'Calhoun Double', 'Two queen beds with space for a family stay.', 445.00::numeric, 4, 6),
    ('The Forsyth', 'Savannah', 'Park King', 'One king bed with a quiet park-facing reading area.', 425.00::numeric, 2, 9),
    ('The Forsyth', 'Savannah', 'Forsyth Suite', 'A one-bedroom suite with a separate parlor.', 625.00::numeric, 4, 4),
    ('The Aoyama', 'Tokyo', 'Garden King', 'One king bed overlooking a quiet interior garden.', 520.00::numeric, 2, 8),
    ('The Aoyama', 'Tokyo', 'Aoyama Suite', 'A corner suite with a separate sitting room and city views.', 780.00::numeric, 4, 3),
    ('The Marunouchi', 'Tokyo', 'Palace View King', 'One king bed facing the Imperial Palace gardens.', 480.00::numeric, 2, 10),
    ('The Marunouchi', 'Tokyo', 'Executive Suite', 'A high-floor suite with a private lounge and skyline views.', 720.00::numeric, 4, 4),
    ('The Kamogawa', 'Kyoto', 'Riverside Room', 'A tatami-inflected room facing the Kamogawa river.', 540.00::numeric, 2, 8),
    ('The Kamogawa', 'Kyoto', 'Machiya Suite', 'A two-room suite with a cypress soaking bath.', 820.00::numeric, 4, 3),
    ('The Bund', 'Shanghai', 'River View King', 'One king bed with wide views of the Huangpu river.', 430.00::numeric, 2, 12),
    ('The Bund', 'Shanghai', 'Skyline Suite', 'A parlor suite overlooking the Pudong skyline.', 690.00::numeric, 4, 5),
    ('The Marais', 'Paris', 'Courtyard King', 'One king bed opening onto the planted courtyard.', 560.00::numeric, 2, 7),
    ('The Marais', 'Paris', 'Marais Suite', 'A suite with a separate salon under exposed beams.', 840.00::numeric, 4, 3),
    ('The Gramercy', 'New York', 'Park King', 'One king bed facing the leafy private square.', 590.00::numeric, 2, 9),
    ('The Gramercy', 'New York', 'Gramercy Suite', 'A pre-war suite with a separate living room.', 910.00::numeric, 4, 4)
) AS room_seed(hotel_name, city, name, description, price_per_night, capacity, total_rooms)
JOIN hotels
  ON hotels.name = room_seed.hotel_name
  AND hotels.city = room_seed.city
ON CONFLICT (hotel_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  price_per_night = EXCLUDED.price_per_night,
  capacity = EXCLUDED.capacity,
  total_rooms = EXCLUDED.total_rooms,
  is_active = true;
