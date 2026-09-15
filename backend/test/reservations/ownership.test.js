import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  batteryRoom,
  createAdministratorSession,
  createCustomerSession,
  createReservationTestContext,
  createTestDatabase,
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

describe('reservation ownership', () => {
  it('lists only the authenticated customer reservations newest first', async () => {
    const first = await createCustomerSession(context);
    const second = await createCustomerSession(context, {
      email: 'second@example.com',
    });
    const firstReservation = await reserve(context, {
      cookie: first.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);
    await reserve(context, {
      cookie: second.cookie,
      input: {
        ...reservationInput,
        roomId: room.id,
        checkIn: '2026-11-10',
        checkOut: '2026-11-12',
      },
    }).expect(201);

    const response = await context.request
      .get('/api/reservations/my')
      .set('Cookie', first.cookie)
      .expect(200);
    expect(response.body.reservations).toEqual([
      expect.objectContaining({ id: firstReservation.body.reservation.id }),
    ]);
  });

  it('allows the owner and an administrator to read one reservation', async () => {
    const customer = await createCustomerSession(context);
    const created = await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);
    const id = created.body.reservation.id;

    await context.request
      .get(`/api/reservations/${id}`)
      .set('Cookie', customer.cookie)
      .expect(200);
    const administratorCookie = await createAdministratorSession(context);
    await context.request
      .get(`/api/reservations/${id}`)
      .set('Cookie', administratorCookie)
      .expect(200);
  });

  it('returns the same 404 for another customer and an unknown reservation', async () => {
    const owner = await createCustomerSession(context);
    const other = await createCustomerSession(context, {
      email: 'other@example.com',
    });
    const created = await reserve(context, {
      cookie: owner.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);

    const forbidden = await context.request
      .get(`/api/reservations/${created.body.reservation.id}`)
      .set('Cookie', other.cookie)
      .expect(404);
    const missing = await context.request
      .get('/api/reservations/999999')
      .set('Cookie', other.cookie)
      .expect(404);
    expect(forbidden.body.error.code).toBe('NOT_FOUND');
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('requires authentication and validates reservation identifiers', async () => {
    await context.request.get('/api/reservations/my').expect(401);
    const customer = await createCustomerSession(context);
    const invalid = await context.request
      .get('/api/reservations/not-an-id')
      .set('Cookie', customer.cookie)
      .expect(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });
});
