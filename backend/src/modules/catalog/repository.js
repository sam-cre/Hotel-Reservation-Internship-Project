import { mapHotel, mapRoom } from './mappers.js';

const hotelColumns = `
  h.id::text,
  h.name,
  h.description,
  h.city,
  h.address,
  h.rating,
  h.image_url,
  h.amenities,
  h.is_active,
  h.created_at
`;

const roomColumns = `
  r.id::text,
  r.hotel_id::text,
  r.name,
  r.description,
  r.price_per_night,
  r.capacity,
  r.total_rooms,
  r.is_active,
  r.created_at
`;

export function createCatalogRepository(database) {
  return {
    async searchHotels({ city, stay }) {
      if (!stay) {
        const result = await database.query(
          `SELECT ${hotelColumns}, MIN(r.price_per_night) AS starting_price
           FROM hotels h
           JOIN rooms r ON r.hotel_id = h.id AND r.is_active = true
           WHERE h.is_active = true
             AND ($1::text IS NULL OR lower(h.city) = lower($1))
           GROUP BY h.id
           ORDER BY lower(h.city), lower(h.name), h.id`,
          [city ?? null],
        );
        return result.rows.map(mapHotel);
      }
      const result = await database.query(
        `WITH available_rooms AS (
           SELECT r.hotel_id, r.price_per_night
           FROM rooms r
           LEFT JOIN reservations reservation
             ON reservation.room_id = r.id
            AND reservation.status = 'confirmed'
            AND reservation.check_in < $3::date
            AND reservation.check_out > $2::date
           WHERE r.is_active = true
             AND r.capacity >= $4
           GROUP BY r.id
           HAVING COUNT(reservation.id) < r.total_rooms
         )
         SELECT ${hotelColumns}, MIN(available_rooms.price_per_night) AS starting_price
         FROM hotels h
         JOIN available_rooms ON available_rooms.hotel_id = h.id
         WHERE h.is_active = true
           AND ($1::text IS NULL OR lower(h.city) = lower($1))
         GROUP BY h.id
         ORDER BY lower(h.city), lower(h.name), h.id`,
        [city ?? null, stay.checkIn, stay.checkOut, stay.guests],
      );
      return result.rows.map(mapHotel);
    },

    async listActiveHotelsForAdmin() {
      // The public search inner-joins active rooms, so a freshly created hotel
      // with no rooms yet would be invisible. Administrators need every active
      // property, so this left-joins rooms and reports a null starting price
      // for hotels that have no priced inventory.
      const result = await database.query(
        `SELECT ${hotelColumns}, MIN(r.price_per_night) AS starting_price
         FROM hotels h
         LEFT JOIN rooms r ON r.hotel_id = h.id AND r.is_active = true
         WHERE h.is_active = true
         GROUP BY h.id
         ORDER BY lower(h.city), lower(h.name), h.id`,
      );
      return result.rows.map(mapHotel);
    },

    async insertImage({ contentType, byteSize, bytes }) {
      const result = await database.query(
        `INSERT INTO hotel_images (content_type, byte_size, bytes)
         VALUES ($1, $2, $3)
         RETURNING id::text`,
        [contentType, byteSize, bytes],
      );
      return result.rows[0].id;
    },

    async findImage(id) {
      const result = await database.query(
        'SELECT content_type, bytes FROM hotel_images WHERE id = $1',
        [id],
      );
      return result.rows[0] ?? null;
    },

    async findPublicHotel(id) {
      const result = await database.query(
        `SELECT ${hotelColumns}
         FROM hotels h
         WHERE h.id = $1 AND h.is_active = true`,
        [id],
      );
      return mapHotel(result.rows[0]);
    },

    async findActiveHotelForUpdate(client, id) {
      const result = await client.query(
        `SELECT id::text
         FROM hotels
         WHERE id = $1 AND is_active = true
         FOR UPDATE`,
        [id],
      );
      return result.rows[0] ?? null;
    },

    async createHotel(input) {
      const result = await database.query(
        `INSERT INTO hotels
           (name, description, city, address, rating, image_url, amenities)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id::text, name, description, city, address, rating,
                   image_url, amenities, is_active, created_at`,
        [
          input.name,
          input.description,
          input.city,
          input.address,
          input.rating,
          input.imageUrl,
          input.amenities,
        ],
      );
      return mapHotel(result.rows[0]);
    },

    async updateHotel(id, input) {
      const result = await database.query(
        `UPDATE hotels
         SET name = $1, description = $2, city = $3, address = $4,
             rating = $5, image_url = $6, amenities = $7
         WHERE id = $8 AND is_active = true
         RETURNING id::text, name, description, city, address, rating,
                   image_url, amenities, is_active, created_at`,
        [
          input.name,
          input.description,
          input.city,
          input.address,
          input.rating,
          input.imageUrl,
          input.amenities,
          id,
        ],
      );
      return mapHotel(result.rows[0]);
    },

    async deactivateHotel(client, id) {
      const result = await client.query(
        `UPDATE hotels SET is_active = false
         WHERE id = $1 AND is_active = true
         RETURNING id::text`,
        [id],
      );
      if (!result.rows[0]) return false;
      await client.query(
        'UPDATE rooms SET is_active = false WHERE hotel_id = $1',
        [id],
      );
      return true;
    },

    async lockHotelRooms(client, hotelId) {
      await client.query(
        `SELECT id::text
         FROM rooms
         WHERE hotel_id = $1
         ORDER BY id
         FOR UPDATE`,
        [hotelId],
      );
    },

    async listPublicRooms(hotelId, stay) {
      if (!stay) {
        const result = await database.query(
          `SELECT ${roomColumns}
           FROM rooms r
           WHERE r.hotel_id = $1 AND r.is_active = true
           ORDER BY r.price_per_night, lower(r.name), r.id`,
          [hotelId],
        );
        return result.rows.map(mapRoom);
      }
      const result = await database.query(
        `SELECT ${roomColumns},
                (r.total_rooms - COUNT(reservation.id))::integer AS remaining_rooms,
                (r.capacity >= $4 AND COUNT(reservation.id) < r.total_rooms) AS available,
                (r.price_per_night * $5::integer) AS estimated_total
         FROM rooms r
         LEFT JOIN reservations reservation
           ON reservation.room_id = r.id
          AND reservation.status = 'confirmed'
          AND reservation.check_in < $3::date
          AND reservation.check_out > $2::date
         WHERE r.hotel_id = $1 AND r.is_active = true
         GROUP BY r.id
         ORDER BY r.price_per_night, lower(r.name), r.id`,
        [hotelId, stay.checkIn, stay.checkOut, stay.guests, stay.nights],
      );
      return result.rows.map(mapRoom);
    },

    async createRoom(client, hotelId, input) {
      const result = await client.query(
        `INSERT INTO rooms
           (hotel_id, name, description, price_per_night, capacity, total_rooms)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id::text, hotel_id::text, name, description, price_per_night,
                   capacity, total_rooms, is_active, created_at`,
        [
          hotelId,
          input.name,
          input.description,
          input.pricePerNight.toFixed(2),
          input.capacity,
          input.totalRooms,
        ],
      );
      return mapRoom(result.rows[0]);
    },

    async findActiveRoomForUpdate(client, id) {
      const result = await client.query(
        `SELECT id::text
         FROM rooms
         WHERE id = $1 AND is_active = true
         FOR UPDATE`,
        [id],
      );
      return result.rows[0] ?? null;
    },

    async requiredFutureInventory(client, roomId, today) {
      const result = await client.query(
        `SELECT
           COALESCE(MAX(occupancy), 0)::integer AS maximum_occupancy,
           COALESCE(MAX(guests), 0)::integer AS maximum_guests
         FROM (
           SELECT
             COUNT(concurrent.id)::integer AS occupancy,
             MAX(anchor.guests)::integer AS guests
           FROM reservations anchor
           JOIN reservations concurrent
             ON concurrent.room_id = anchor.room_id
            AND concurrent.status = 'confirmed'
            AND concurrent.check_in <= anchor.check_in
            AND concurrent.check_out > anchor.check_in
           WHERE anchor.room_id = $1
             AND anchor.status = 'confirmed'
             AND anchor.check_out > $2::date
           GROUP BY anchor.check_in
         ) future_usage`,
        [roomId, today],
      );
      return {
        maximumOccupancy: Number(result.rows[0].maximum_occupancy),
        maximumGuests: Number(result.rows[0].maximum_guests),
      };
    },

    async updateRoom(client, id, input) {
      const result = await client.query(
        `UPDATE rooms
         SET name = $1, description = $2, price_per_night = $3,
             capacity = $4, total_rooms = $5
         WHERE id = $6 AND is_active = true
         RETURNING id::text, hotel_id::text, name, description, price_per_night,
                   capacity, total_rooms, is_active, created_at`,
        [
          input.name,
          input.description,
          input.pricePerNight.toFixed(2),
          input.capacity,
          input.totalRooms,
          id,
        ],
      );
      return mapRoom(result.rows[0]);
    },

    async deactivateRoom(client, id) {
      const result = await client.query(
        `UPDATE rooms SET is_active = false
         WHERE id = $1 AND is_active = true
         RETURNING id::text`,
        [id],
      );
      return Boolean(result.rows[0]);
    },
  };
}
