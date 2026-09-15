CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  CONSTRAINT users_email_length CHECK (char_length(email) BETWEEN 3 AND 320),
  CONSTRAINT users_email_normalized CHECK (email = lower(btrim(email))),
  CONSTRAINT users_password_hash_length CHECK (char_length(password) >= 20),
  CONSTRAINT users_role_allowed CHECK (role IN ('customer', 'admin')),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE hotels (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  rating numeric(2, 1) NOT NULL,
  image_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hotels_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  CONSTRAINT hotels_description_length CHECK (char_length(btrim(description)) BETWEEN 1 AND 5000),
  CONSTRAINT hotels_city_length CHECK (char_length(btrim(city)) BETWEEN 1 AND 120),
  CONSTRAINT hotels_address_length CHECK (char_length(btrim(address)) BETWEEN 1 AND 300),
  CONSTRAINT hotels_rating_range CHECK (rating BETWEEN 0.0 AND 5.0),
  CONSTRAINT hotels_image_url_format CHECK (image_url ~ '^(https?://|/)'),
  CONSTRAINT hotels_name_city_unique UNIQUE (name, city)
);

CREATE TABLE rooms (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hotel_id bigint NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text NOT NULL,
  price_per_night numeric(10, 2) NOT NULL,
  capacity integer NOT NULL,
  total_rooms integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rooms_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  CONSTRAINT rooms_description_length CHECK (char_length(btrim(description)) BETWEEN 1 AND 5000),
  CONSTRAINT rooms_price_positive CHECK (price_per_night > 0),
  CONSTRAINT rooms_capacity_positive CHECK (capacity > 0),
  CONSTRAINT rooms_inventory_positive CHECK (total_rooms > 0),
  CONSTRAINT rooms_hotel_name_unique UNIQUE (hotel_id, name)
);

CREATE TABLE reservations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  room_id bigint NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL,
  price_per_night_snapshot numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  idempotency_key uuid NOT NULL,
  request_fingerprint character(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reservations_dates_ordered CHECK (check_out > check_in),
  CONSTRAINT reservations_guests_positive CHECK (guests > 0),
  CONSTRAINT reservations_nightly_price_positive CHECK (price_per_night_snapshot > 0),
  CONSTRAINT reservations_total_price_positive CHECK (total_price > 0),
  CONSTRAINT reservations_status_allowed CHECK (status IN ('confirmed', 'cancelled')),
  CONSTRAINT reservations_fingerprint_format CHECK (request_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT reservations_user_idempotency_unique UNIQUE (user_id, idempotency_key)
);

CREATE INDEX hotels_active_city_idx
  ON hotels (lower(city), id)
  WHERE is_active = true;

CREATE INDEX rooms_active_hotel_idx
  ON rooms (hotel_id, capacity, price_per_night, id)
  WHERE is_active = true;

CREATE INDEX reservations_confirmed_room_dates_idx
  ON reservations (room_id, check_in, check_out)
  WHERE status = 'confirmed';

CREATE INDEX reservations_user_created_idx
  ON reservations (user_id, created_at DESC, id DESC);
