import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  migrationsDirectory,
  developmentSeedPath,
} from '../../src/db/paths.js';
import { loadMigrations } from '../../src/db/migrations.js';

let database;

async function insertHotelAndRoom() {
  const hotel = await database.query(
    `INSERT INTO hotels
      (name, description, city, address, rating, image_url)
     VALUES
      ('Test Hotel', 'Test description', 'Boston', '1 Test Way', 4.5, '/images/test.jpg')
     RETURNING id`,
  );
  const room = await database.query(
    `INSERT INTO rooms
      (hotel_id, name, description, price_per_night, capacity, total_rooms)
     VALUES
      ($1, 'Test King', 'Test room', 250.00, 2, 2)
     RETURNING id`,
    [hotel.rows[0].id],
  );
  return room.rows[0].id;
}

async function insertUser(email = 'customer@example.com', role = 'customer') {
  const user = await database.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ('Test Customer', $1, '$argon2id$test-placeholder-value', $2)
     RETURNING id`,
    [email, role],
  );
  return user.rows[0].id;
}

beforeEach(async () => {
  database = new PGlite();
  const migrations = await loadMigrations(migrationsDirectory);
  for (const migration of migrations) await database.exec(migration.sql);
});

afterEach(async () => {
  await database.close();
});

describe('initial PostgreSQL schema', () => {
  it('creates the four assignment tables with the required extensions', async () => {
    const result = await database.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    expect(result.rows.map((row) => row.table_name)).toEqual([
      'hotels',
      'reservations',
      'rooms',
      'users',
    ]);
    const reservationColumns = await database.query(`
      SELECT column_name, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reservations'
    `);
    expect(reservationColumns.rows.map((row) => row.column_name)).toEqual(
      expect.arrayContaining([
        'price_per_night_snapshot',
        'total_price',
        'idempotency_key',
        'request_fingerprint',
      ]),
    );
    expect(
      reservationColumns.rows.find(
        (column) => column.column_name === 'total_price',
      ),
    ).toMatchObject({ numeric_precision: 18, numeric_scale: 2 });
  });

  it('enforces normalized users and allowed roles', async () => {
    await expect(insertUser('UPPER@example.com')).rejects.toThrow();
    await expect(insertUser('customer@example.com', 'owner')).rejects.toThrow();
    await expect(insertUser()).resolves.toBeDefined();
    await expect(insertUser()).rejects.toThrow();
  });

  it('enforces hotel and room value constraints', async () => {
    await expect(
      database.query(`
        INSERT INTO hotels
          (name, description, city, address, rating, image_url)
        VALUES ('Invalid', 'Description', 'Boston', '1 Way', 5.1, 'javascript:test')
      `),
    ).rejects.toThrow();
    const roomId = await insertHotelAndRoom();
    expect(roomId).toBeDefined();
    await expect(
      database.query(`
        INSERT INTO rooms
          (hotel_id, name, description, price_per_night, capacity, total_rooms)
        VALUES (1, 'Invalid', 'Description', 0, 0, 0)
      `),
    ).rejects.toThrow();
  });

  it('enforces reservation dates, snapshots, statuses, and idempotency', async () => {
    const userId = await insertUser();
    const roomId = await insertHotelAndRoom();
    const values = [
      userId,
      roomId,
      '2026-10-10',
      '2026-10-12',
      2,
      '250.00',
      '500.00',
      'confirmed',
      '2f6c5e97-93fe-4c67-8d7f-8473eb931e15',
      'a'.repeat(64),
    ];
    await database.query(
      `INSERT INTO reservations
        (user_id, room_id, check_in, check_out, guests,
         price_per_night_snapshot, total_price, status,
         idempotency_key, request_fingerprint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      values,
    );
    await expect(
      database.query(
        `INSERT INTO reservations
          (user_id, room_id, check_in, check_out, guests,
           price_per_night_snapshot, total_price, status,
           idempotency_key, request_fingerprint)
         VALUES ($1, $2, $3, $3, $5, $6, $7, $8, $9, $10)`,
        values,
      ),
    ).rejects.toThrow();
    await expect(
      database.query(
        `INSERT INTO reservations
          (user_id, room_id, check_in, check_out, guests,
           price_per_night_snapshot, total_price, status,
           idempotency_key, request_fingerprint)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $9, $10)`,
        values,
      ),
    ).rejects.toThrow();
    await expect(
      database.query(
        `INSERT INTO reservations
          (user_id, room_id, check_in, check_out, guests,
           price_per_night_snapshot, total_price, status,
           idempotency_key, request_fingerprint)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        values,
      ),
    ).rejects.toThrow();
  });

  it('retains referenced users, hotels, and rooms', async () => {
    const userId = await insertUser();
    const roomId = await insertHotelAndRoom();
    await database.query(
      `INSERT INTO reservations
        (user_id, room_id, check_in, check_out, guests,
         price_per_night_snapshot, total_price, idempotency_key,
         request_fingerprint)
       VALUES ($1, $2, '2026-10-10', '2026-10-12', 2,
         250.00, 500.00, '0c27473a-bd52-4fb9-b4e4-da1806bc7660', $3)`,
      [userId, roomId, 'b'.repeat(64)],
    );
    await expect(
      database.query('DELETE FROM users WHERE id = $1', [userId]),
    ).rejects.toThrow();
    await expect(
      database.query('DELETE FROM rooms WHERE id = $1', [roomId]),
    ).rejects.toThrow();
  });

  it('creates the indexes used by search and reservation overlap queries', async () => {
    const result = await database.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `);
    expect(result.rows.map((row) => row.indexname)).toEqual(
      expect.arrayContaining([
        'hotels_active_city_idx',
        'rooms_active_hotel_idx',
        'reservations_confirmed_room_dates_idx',
        'reservations_user_created_idx',
      ]),
    );
  });
});

describe('development seed', () => {
  it('is deterministic and idempotent', async () => {
    const sql = await readFile(developmentSeedPath, 'utf8');
    await database.exec(sql);
    await database.exec(sql);
    const hotels = await database.query(
      'SELECT count(*)::integer AS count FROM hotels',
    );
    const rooms = await database.query(
      'SELECT count(*)::integer AS count FROM rooms',
    );
    expect(hotels.rows[0].count).toBe(3);
    expect(rooms.rows[0].count).toBe(6);
  });
});
