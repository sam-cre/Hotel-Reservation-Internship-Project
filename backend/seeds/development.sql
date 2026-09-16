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
    ('The Forsyth', 'Savannah', 'Forsyth Suite', 'A one-bedroom suite with a separate parlor.', 625.00::numeric, 4, 4)
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
