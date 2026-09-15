import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { applyMigrations, loadMigrations } from '../../src/db/migrations.js';
import { migrationsDirectory } from '../../src/db/paths.js';
import { createReservationService } from '../../src/modules/reservations/service.js';
import { createCatalogService } from '../../src/modules/catalog/service.js';

const { Pool } = pg;
const connectionString = process.env.TEST_DATABASE_URL;
const runIntegration = Boolean(connectionString);
const schema = `t6_reservations_${process.pid}_${Date.now()}`;
let administrationPool;
let reservationPool;
let roomId;
let userIds;

function requireTestDatabase(value) {
  const databaseName = new URL(value).pathname.slice(1);
  if (
    process.env.NODE_ENV !== 'test' ||
    !/^(test_.+|.+_test)$/.test(databaseName.toLowerCase())
  ) {
    throw new Error(
      'TEST_DATABASE_URL requires NODE_ENV=test and a test_ prefix or _test suffix.',
    );
  }
}

function createLockBarrier(database) {
  let attempts = 0;
  let releaseFirst;
  let markFirstLocked;
  let markSecondAttempted;
  const firstLocked = new Promise((resolve) => {
    markFirstLocked = resolve;
  });
  const secondAttempted = new Promise((resolve) => {
    markSecondAttempted = resolve;
  });
  const firstMayContinue = new Promise((resolve) => {
    releaseFirst = resolve;
  });

  return {
    database: {
      query(sql, values) {
        return database.query(sql, values);
      },
      async connect() {
        const client = await database.connect();
        return {
          async query(sql, values) {
            const isRoomLock =
              typeof sql === 'string' &&
              sql.includes('FROM rooms') &&
              sql.includes('FOR UPDATE');
            if (isRoomLock) {
              attempts += 1;
              if (attempts === 2) markSecondAttempted();
            }
            const result = await client.query(sql, values);
            if (isRoomLock && attempts === 1) {
              markFirstLocked();
              await firstMayContinue;
            }
            return result;
          },
          release() {
            client.release();
          },
        };
      },
    },
    firstLocked,
    releaseFirst,
    secondAttempted,
  };
}

describe.skipIf(!runIntegration)('PostgreSQL reservation concurrency', () => {
  beforeAll(async () => {
    requireTestDatabase(connectionString);
    administrationPool = new Pool({
      connectionString,
      ssl: false,
      max: 1,
      allowExitOnIdle: true,
    });
    await administrationPool.query(`CREATE SCHEMA "${schema}"`);
    reservationPool = new Pool({
      connectionString,
      ssl: false,
      max: 4,
      options: `-c search_path=${schema},public`,
      allowExitOnIdle: true,
    });
    const client = await reservationPool.connect();
    try {
      const migrations = await loadMigrations(migrationsDirectory);
      await applyMigrations(client, migrations, { useAdvisoryLock: false });
      const users = await client.query(
        `INSERT INTO users (name, email, password, role)
         VALUES
           ('First Guest', 'first-concurrency@example.com', $1, 'customer'),
           ('Second Guest', 'second-concurrency@example.com', $1, 'customer')
         RETURNING id::text`,
        ['test-password-hash-placeholder'],
      );
      userIds = users.rows.map((row) => row.id);
      const hotel = await client.query(
        `INSERT INTO hotels
           (name, description, city, address, rating, image_url)
         VALUES
           ('Concurrency Hotel', 'Test hotel.', 'Test City', '1 Test Street', 5.0, '/test.jpg')
         RETURNING id::text`,
      );
      const room = await client.query(
        `INSERT INTO rooms
           (hotel_id, name, description, price_per_night, capacity, total_rooms)
         VALUES ($1, 'Last Room', 'Test room.', 200.00, 2, 1)
         RETURNING id::text`,
        [hotel.rows[0].id],
      );
      roomId = room.rows[0].id;
    } finally {
      client.release();
    }
  });

  beforeEach(async () => {
    await reservationPool.query('DELETE FROM reservations');
    await reservationPool.query(
      `UPDATE rooms
       SET is_active = true, price_per_night = 200.00,
           capacity = 2, total_rooms = 1
       WHERE id = $1`,
      [roomId],
    );
  });

  afterAll(async () => {
    await reservationPool?.end();
    if (administrationPool) {
      await administrationPool.query(
        `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
      );
      await administrationPool.end();
    }
  });

  it('creates exactly one reservation from synchronized attempts for the final unit', async () => {
    const barrier = createLockBarrier(reservationPool);
    const service = createReservationService({
      database: barrier.database,
      now: () => new Date('2026-09-15T12:00:00.000Z'),
    });
    const input = {
      roomId,
      checkIn: '2026-10-10',
      checkOut: '2026-10-13',
      guests: 2,
    };

    const first = service.createReservation({
      userId: userIds[0],
      input,
      idempotencyKey: randomUUID(),
    });
    await barrier.firstLocked;
    const second = service.createReservation({
      userId: userIds[1],
      input,
      idempotencyKey: randomUUID(),
    });
    await barrier.secondAttempted;
    barrier.releaseFirst();

    const results = await Promise.allSettled([first, second]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const rejection = results.find((result) => result.status === 'rejected');
    expect(rejection.reason).toMatchObject({
      status: 409,
      code: 'ROOM_UNAVAILABLE',
    });
    const count = await reservationPool.query(
      "SELECT COUNT(*)::integer AS count FROM reservations WHERE status = 'confirmed'",
    );
    expect(count.rows[0].count).toBe(1);
  });

  it('rejects a booking that waits behind room deactivation', async () => {
    const barrier = createLockBarrier(reservationPool);
    const catalog = createCatalogService({
      database: barrier.database,
      now: () => new Date('2026-09-15T12:00:00.000Z'),
    });
    const reservations = createReservationService({
      database: barrier.database,
      now: () => new Date('2026-09-15T12:00:00.000Z'),
    });

    const deactivation = catalog.deleteRoom(roomId);
    await barrier.firstLocked;
    const booking = reservations.createReservation({
      userId: userIds[0],
      input: {
        roomId,
        checkIn: '2026-10-10',
        checkOut: '2026-10-13',
        guests: 2,
      },
      idempotencyKey: randomUUID(),
    });
    await barrier.secondAttempted;
    barrier.releaseFirst();

    await expect(deactivation).resolves.toBeUndefined();
    await expect(booking).rejects.toMatchObject({
      status: 404,
      code: 'ROOM_NOT_FOUND',
    });
    const state = await reservationPool.query(
      `SELECT is_active,
              (SELECT COUNT(*)::integer FROM reservations) AS reservations
       FROM rooms WHERE id = $1`,
      [roomId],
    );
    expect(state.rows[0]).toEqual({ is_active: false, reservations: 0 });
  });

  it('lets a waiting booking use inventory released by cancellation', async () => {
    const initialService = createReservationService({
      database: reservationPool,
      now: () => new Date('2026-09-15T12:00:00.000Z'),
    });
    const existing = await initialService.createReservation({
      userId: userIds[0],
      input: {
        roomId,
        checkIn: '2026-10-10',
        checkOut: '2026-10-13',
        guests: 2,
      },
      idempotencyKey: randomUUID(),
    });
    const barrier = createLockBarrier(reservationPool);
    const service = createReservationService({
      database: barrier.database,
      now: () => new Date('2026-09-15T12:00:00.000Z'),
    });

    const cancellation = service.updateStatus(
      existing.reservation.id,
      'cancelled',
    );
    await barrier.firstLocked;
    const booking = service.createReservation({
      userId: userIds[1],
      input: {
        roomId,
        checkIn: '2026-10-10',
        checkOut: '2026-10-13',
        guests: 2,
      },
      idempotencyKey: randomUUID(),
    });
    await barrier.secondAttempted;
    barrier.releaseFirst();

    await expect(cancellation).resolves.toMatchObject({ status: 'cancelled' });
    await expect(booking).resolves.toMatchObject({
      created: true,
      reservation: { status: 'confirmed' },
    });
  });

  it('rejects a booking that waits behind a valid inventory reduction', async () => {
    await reservationPool.query(
      'UPDATE rooms SET total_rooms = 2 WHERE id = $1',
      [roomId],
    );
    const initialService = createReservationService({
      database: reservationPool,
      now: () => new Date('2026-09-15T12:00:00.000Z'),
    });
    await initialService.createReservation({
      userId: userIds[0],
      input: {
        roomId,
        checkIn: '2026-10-10',
        checkOut: '2026-10-13',
        guests: 2,
      },
      idempotencyKey: randomUUID(),
    });

    const barrier = createLockBarrier(reservationPool);
    const catalog = createCatalogService({
      database: barrier.database,
      now: () => new Date('2026-09-15T12:00:00.000Z'),
    });
    const reservations = createReservationService({
      database: barrier.database,
      now: () => new Date('2026-09-15T12:00:00.000Z'),
    });
    const reduction = catalog.updateRoom(roomId, {
      name: 'Last Room',
      description: 'Test room.',
      pricePerNight: 200,
      capacity: 2,
      totalRooms: 1,
    });
    await barrier.firstLocked;
    const booking = reservations.createReservation({
      userId: userIds[1],
      input: {
        roomId,
        checkIn: '2026-10-10',
        checkOut: '2026-10-13',
        guests: 2,
      },
      idempotencyKey: randomUUID(),
    });
    await barrier.secondAttempted;
    barrier.releaseFirst();

    await expect(reduction).resolves.toMatchObject({ totalRooms: 1 });
    await expect(booking).rejects.toMatchObject({
      status: 409,
      code: 'ROOM_UNAVAILABLE',
    });
  });
});
