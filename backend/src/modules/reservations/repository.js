import { mapReservation } from './mappers.js';

const reservationColumns = `
  reservation.id::text,
  reservation.user_id::text,
  reservation.room_id::text,
  reservation.check_in,
  reservation.check_out,
  reservation.guests,
  reservation.price_per_night_snapshot,
  reservation.total_price,
  reservation.status,
  reservation.request_fingerprint,
  reservation.created_at,
  room.name AS room_name,
  hotel.id::text AS hotel_id,
  hotel.name AS hotel_name,
  hotel.city AS hotel_city,
  customer.name AS customer_name,
  customer.email AS customer_email
`;

const reservationJoins = `
  JOIN rooms room ON room.id = reservation.room_id
  JOIN hotels hotel ON hotel.id = room.hotel_id
  JOIN users customer ON customer.id = reservation.user_id
`;

function mapCustomerReservation(row) {
  return mapReservation(row);
}

function mapAdministratorReservation(row) {
  return mapReservation(row, { includeCustomer: true });
}

export function createReservationRepository(database) {
  async function findById(client, id, { includeCustomer = false } = {}) {
    const result = await client.query(
      `SELECT ${reservationColumns}
       FROM reservations reservation
       ${reservationJoins}
       WHERE reservation.id = $1`,
      [id],
    );
    return includeCustomer
      ? mapAdministratorReservation(result.rows[0])
      : mapCustomerReservation(result.rows[0]);
  }

  return {
    async lockUser(client, userId) {
      const result = await client.query(
        'SELECT id::text FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      );
      return result.rows[0] ?? null;
    },

    async findByIdempotencyKey(client, userId, idempotencyKey) {
      const result = await client.query(
        `SELECT ${reservationColumns}
         FROM reservations reservation
         ${reservationJoins}
         WHERE reservation.user_id = $1
           AND reservation.idempotency_key = $2`,
        [userId, idempotencyKey],
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        fingerprint: row.request_fingerprint,
        reservation: mapCustomerReservation(row),
      };
    },

    async lockBookableRoom(client, roomId) {
      const result = await client.query(
        `SELECT
           room.id::text,
           room.price_per_night,
           room.capacity,
           room.total_rooms
         FROM rooms room
         JOIN hotels hotel ON hotel.id = room.hotel_id
         WHERE room.id = $1
           AND room.is_active = true
           AND hotel.is_active = true
         FOR UPDATE OF room`,
        [roomId],
      );
      return result.rows[0] ?? null;
    },

    async countOverlappingConfirmed(client, roomId, checkIn, checkOut) {
      const result = await client.query(
        `SELECT COUNT(*)::integer AS count
         FROM reservations
         WHERE room_id = $1
           AND status = 'confirmed'
           AND check_in < $3::date
           AND check_out > $2::date`,
        [roomId, checkIn, checkOut],
      );
      return Number(result.rows[0].count);
    },

    async create(
      client,
      {
        userId,
        roomId,
        checkIn,
        checkOut,
        guests,
        idempotencyKey,
        fingerprint,
      },
      pricePerNight,
    ) {
      const inserted = await client.query(
        `INSERT INTO reservations
           (user_id, room_id, check_in, check_out, guests,
            price_per_night_snapshot, total_price, status,
            idempotency_key, request_fingerprint)
         VALUES
           ($1, $2, $3::date, $4::date, $5,
            $6::numeric, $6::numeric * ($4::date - $3::date), 'confirmed',
            $7, $8)
         RETURNING id::text`,
        [
          userId,
          roomId,
          checkIn,
          checkOut,
          guests,
          pricePerNight,
          idempotencyKey,
          fingerprint,
        ],
      );
      return findById(client, inserted.rows[0].id);
    },

    findById,

    async listForUser(userId) {
      const result = await database.query(
        `SELECT ${reservationColumns}
         FROM reservations reservation
         ${reservationJoins}
         WHERE reservation.user_id = $1
         ORDER BY reservation.created_at DESC, reservation.id DESC`,
        [userId],
      );
      return result.rows.map(mapCustomerReservation);
    },

    async findPublicById(id) {
      return findById(database, id);
    },

    async listForAdministrator(status) {
      const result = await database.query(
        `SELECT ${reservationColumns}
         FROM reservations reservation
         ${reservationJoins}
         WHERE ($1::text IS NULL OR reservation.status = $1)
         ORDER BY reservation.created_at DESC, reservation.id DESC`,
        [status ?? null],
      );
      return result.rows.map(mapAdministratorReservation);
    },

    async findIdentity(id) {
      const result = await database.query(
        'SELECT id::text, room_id::text FROM reservations WHERE id = $1',
        [id],
      );
      return result.rows[0] ?? null;
    },

    async lockRoom(client, roomId) {
      const result = await client.query(
        'SELECT id::text FROM rooms WHERE id = $1 FOR UPDATE',
        [roomId],
      );
      return result.rows[0] ?? null;
    },

    async lockReservation(client, id) {
      const result = await client.query(
        `SELECT id::text, status
         FROM reservations
         WHERE id = $1
         FOR UPDATE`,
        [id],
      );
      return result.rows[0] ?? null;
    },

    async cancel(client, id) {
      await client.query(
        `UPDATE reservations
         SET status = 'cancelled'
         WHERE id = $1 AND status = 'confirmed'`,
        [id],
      );
      return findById(client, id, { includeCustomer: true });
    },
  };
}
