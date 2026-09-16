ALTER TABLE hotels
  ADD COLUMN amenities text[] NOT NULL DEFAULT '{}';

ALTER TABLE hotels
  ADD CONSTRAINT hotels_amenities_count CHECK (cardinality(amenities) <= 12);

ALTER TABLE hotels
  ADD CONSTRAINT hotels_amenities_nonempty
  CHECK (array_position(amenities, '') IS NULL);
