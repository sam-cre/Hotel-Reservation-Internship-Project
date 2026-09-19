CREATE TABLE hotel_images (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_type text NOT NULL,
  byte_size integer NOT NULL,
  bytes bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hotel_images_content_type
    CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT hotel_images_byte_size
    CHECK (byte_size > 0 AND byte_size <= 5242880)
);
