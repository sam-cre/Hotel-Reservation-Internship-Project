import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  batteryRoom,
  createCustomerSession,
  createReservationTestContext,
  createTestDatabase,
  randomUUID,
  reservationInput,
  reserve,
  resetCatalogDatabase,
} from './helpers.js';

let context;
let database;
let room;

beforeAll(async () => {
  database = await createTestDatabase();
});

beforeEach(async () => {
  await resetCatalogDatabase(database);
  context = createReservationTestContext(database);
  room = await batteryRoom(database);
});

afterAll(async () => {
  await database.close();
});

describe('reservation creation', () => {
  it('creates a confirmed reservation with database-derived price snapshots', async () => {
    const customer = await createCustomerSession(context);
    const response = await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);

    expect(response.body.reservation).toMatchObject({
      userId: customer.user.id,
      roomId: room.id,
      ...reservationInput,
      pricePerNight: '465.00',
      totalPrice: '1395.00',
      status: 'confirmed',
      room: { id: room.id, name: 'Harbor View King' },
      hotel: { name: 'The Battery', city: 'Charleston' },
    });
  });

  it('requires authentication, a UUID idempotency key, and exact input fields', async () => {
    const input = { ...reservationInput, roomId: room.id };
    await reserve(context, { cookie: '', input }).expect(401);

    const customer = await createCustomerSession(context);
    const missingKey = await context.request
      .post('/api/reservations')
      .set('Cookie', customer.cookie)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Sec-Fetch-Site', 'same-origin')
      .set('X-CSRF-Protection', '1')
      .send(input)
      .expect(400);
    expect(missingKey.body.error.details.fields).toContain('idempotencyKey');

    const invalid = await reserve(context, {
      cookie: customer.cookie,
      input: { ...input, totalPrice: 1, status: 'confirmed', userId: '99' },
    }).expect(400);
    expect(invalid.body.error.details.fields).toEqual(
      expect.arrayContaining(['totalPrice', 'status', 'userId']),
    );
  });

  it('rejects past, reversed, impossible, and over-capacity stays', async () => {
    const customer = await createCustomerSession(context);
    const cases = [
      { ...reservationInput, roomId: room.id, checkIn: '2026-09-14' },
      {
        ...reservationInput,
        roomId: room.id,
        checkOut: reservationInput.checkIn,
      },
      { ...reservationInput, roomId: room.id, checkIn: '2026-02-30' },
    ];
    for (const input of cases) {
      const response = await reserve(context, {
        cookie: customer.cookie,
        input,
      }).expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }

    const capacity = await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id, guests: 3 },
    }).expect(409);
    expect(capacity.body.error.code).toBe('ROOM_CAPACITY_EXCEEDED');
  });

  it('hides missing, inactive, and hotel-inactive room types', async () => {
    const customer = await createCustomerSession(context);
    const missing = await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: '999999' },
    }).expect(404);
    expect(missing.body.error.code).toBe('ROOM_NOT_FOUND');

    await database.query('UPDATE rooms SET is_active = false WHERE id = $1', [
      room.id,
    ]);
    await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(404);

    await database.query('UPDATE rooms SET is_active = true WHERE id = $1', [
      room.id,
    ]);
    await database.query(
      'UPDATE hotels SET is_active = false WHERE id = (SELECT hotel_id FROM rooms WHERE id = $1)',
      [room.id],
    );
    await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(404);
  });

  it('supports multiple units and rejects requests after inventory is exhausted', async () => {
    await database.query('UPDATE rooms SET total_rooms = 2 WHERE id = $1', [
      room.id,
    ]);
    const first = await createCustomerSession(context);
    const second = await createCustomerSession(context, {
      email: 'second@example.com',
    });
    const third = await createCustomerSession(context, {
      email: 'third@example.com',
    });
    const input = { ...reservationInput, roomId: room.id };

    await reserve(context, { cookie: first.cookie, input }).expect(201);
    await reserve(context, { cookie: second.cookie, input }).expect(201);
    const unavailable = await reserve(context, {
      cookie: third.cookie,
      input,
    }).expect(409);
    expect(unavailable.body.error.code).toBe('ROOM_UNAVAILABLE');
  });

  it('allows back-to-back stays while rejecting every true overlap shape', async () => {
    await database.query('UPDATE rooms SET total_rooms = 1 WHERE id = $1', [
      room.id,
    ]);
    const first = await createCustomerSession(context);
    const second = await createCustomerSession(context, {
      email: 'second@example.com',
    });
    const input = { ...reservationInput, roomId: room.id };
    await reserve(context, { cookie: first.cookie, input }).expect(201);

    const overlaps = [
      { checkIn: '2026-10-09', checkOut: '2026-10-11' },
      { checkIn: '2026-10-11', checkOut: '2026-10-12' },
      { checkIn: '2026-10-12', checkOut: '2026-10-14' },
      { checkIn: '2026-10-09', checkOut: '2026-10-14' },
    ];
    for (const dates of overlaps) {
      await reserve(context, {
        cookie: second.cookie,
        input: { ...input, ...dates },
        idempotencyKey: randomUUID(),
      }).expect(409);
    }

    await reserve(context, {
      cookie: second.cookie,
      input: { ...input, checkIn: '2026-10-13', checkOut: '2026-10-15' },
    }).expect(201);
  });

  it('allows a multi-unit booking when existing stays never share a night', async () => {
    await database.query('UPDATE rooms SET total_rooms = 2 WHERE id = $1', [
      room.id,
    ]);
    const first = await createCustomerSession(context);
    const second = await createCustomerSession(context, {
      email: 'second@example.com',
    });
    const third = await createCustomerSession(context, {
      email: 'third@example.com',
    });
    const base = { ...reservationInput, roomId: room.id };
    // Two back-to-back one-night stays: one unit is used on 10/10, one on 10/11.
    await reserve(context, {
      cookie: first.cookie,
      input: { ...base, checkIn: '2026-10-10', checkOut: '2026-10-11' },
    }).expect(201);
    await reserve(context, {
      cookie: second.cookie,
      input: { ...base, checkIn: '2026-10-11', checkOut: '2026-10-12' },
    }).expect(201);
    // Spans both nights. Peak concurrent occupancy of the existing stays is 1 on
    // each night, below the 2 units, so this fits. The old cumulative count saw
    // two overlapping reservations and wrongly rejected it.
    await reserve(context, {
      cookie: third.cookie,
      input: { ...base, checkIn: '2026-10-10', checkOut: '2026-10-12' },
    }).expect(201);
  });
});
