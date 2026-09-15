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
let customer;

beforeAll(async () => {
  database = await createTestDatabase();
});

beforeEach(async () => {
  await resetCatalogDatabase(database);
  context = createReservationTestContext(database);
  room = await batteryRoom(database);
  customer = await createCustomerSession(context);
});

afterAll(async () => {
  await database.close();
});

describe('idempotency and pricing', () => {
  it('returns the original reservation for an identical idempotent retry', async () => {
    const idempotencyKey = randomUUID();
    const input = { ...reservationInput, roomId: room.id };
    const created = await reserve(context, {
      cookie: customer.cookie,
      input,
      idempotencyKey,
    }).expect(201);
    const retried = await reserve(context, {
      cookie: customer.cookie,
      input,
      idempotencyKey,
    }).expect(200);

    expect(retried.body).toEqual(created.body);
    const count = await database.query(
      'SELECT COUNT(*)::integer AS count FROM reservations',
    );
    expect(count.rows[0].count).toBe(1);
  });

  it('rejects reuse of an idempotency key for different reservation input', async () => {
    const idempotencyKey = randomUUID();
    const input = { ...reservationInput, roomId: room.id };
    await reserve(context, {
      cookie: customer.cookie,
      input,
      idempotencyKey,
    }).expect(201);
    const response = await reserve(context, {
      cookie: customer.cookie,
      input: { ...input, checkOut: '2026-10-14' },
      idempotencyKey,
    }).expect(409);
    expect(response.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('scopes an idempotency key to one user', async () => {
    const second = await createCustomerSession(context, {
      email: 'second@example.com',
    });
    const idempotencyKey = randomUUID();
    const input = { ...reservationInput, roomId: room.id };
    const firstReservation = await reserve(context, {
      cookie: customer.cookie,
      input,
      idempotencyKey,
    }).expect(201);
    const secondReservation = await reserve(context, {
      cookie: second.cookie,
      input,
      idempotencyKey,
    }).expect(201);

    expect(secondReservation.body.reservation.id).not.toBe(
      firstReservation.body.reservation.id,
    );
  });

  it('preserves the nightly and total price after later room-price changes', async () => {
    const created = await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);
    await database.query(
      'UPDATE rooms SET price_per_night = 999.00 WHERE id = $1',
      [room.id],
    );

    const fetched = await context.request
      .get(`/api/reservations/${created.body.reservation.id}`)
      .set('Cookie', customer.cookie)
      .expect(200);
    expect(fetched.body.reservation).toMatchObject({
      pricePerNight: '465.00',
      totalPrice: '1395.00',
    });
  });

  it('serializes large exact-decimal totals without floating-point loss', async () => {
    await database.query(
      'UPDATE rooms SET price_per_night = 99999999.99 WHERE id = $1',
      [room.id],
    );
    const checkOut = '9999-12-31';
    const nights = BigInt(
      (Date.parse(`${checkOut}T00:00:00.000Z`) -
        Date.parse(`${reservationInput.checkIn}T00:00:00.000Z`)) /
        86400000,
    );
    const totalCents = 9999999999n * nights;
    const expectedTotal = `${totalCents / 100n}.${String(totalCents % 100n).padStart(2, '0')}`;

    const response = await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id, checkOut },
    }).expect(201);
    expect(response.body.reservation).toMatchObject({
      pricePerNight: '99999999.99',
      totalPrice: expectedTotal,
    });
  });
});
