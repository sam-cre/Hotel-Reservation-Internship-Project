import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  apiMutation,
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

describe('reservation administration', () => {
  it('requires the current administrator role', async () => {
    await context.request.get('/api/admin/reservations').expect(401);
    const customer = await createCustomerSession(context);
    await context.request
      .get('/api/admin/reservations')
      .set('Cookie', customer.cookie)
      .expect(403);
    await apiMutation(
      context.request,
      'put',
      '/api/admin/reservations/1/status',
    )
      .set('Cookie', customer.cookie)
      .send({ status: 'cancelled' })
      .expect(403);
  });

  it('lists customer details and supports a strict status filter', async () => {
    const customer = await createCustomerSession(context);
    await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);
    const administratorCookie = await createAdministratorSession(context);

    const all = await context.request
      .get('/api/admin/reservations')
      .set('Cookie', administratorCookie)
      .expect(200);
    expect(all.body.reservations).toEqual([
      expect.objectContaining({
        status: 'confirmed',
        customer: {
          id: customer.user.id,
          name: customer.user.name,
          email: customer.user.email,
        },
      }),
    ]);

    const cancelled = await context.request
      .get('/api/admin/reservations')
      .query({ status: 'cancelled' })
      .set('Cookie', administratorCookie)
      .expect(200);
    expect(cancelled.body.reservations).toEqual([]);

    await context.request
      .get('/api/admin/reservations')
      .query({ status: 'pending' })
      .set('Cookie', administratorCookie)
      .expect(400);
  });

  it('cancels a confirmed reservation and releases its inventory', async () => {
    await database.query('UPDATE rooms SET total_rooms = 1 WHERE id = $1', [
      room.id,
    ]);
    const customer = await createCustomerSession(context);
    const created = await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);
    const second = await createCustomerSession(context, {
      email: 'second@example.com',
    });
    await reserve(context, {
      cookie: second.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(409);

    const administratorCookie = await createAdministratorSession(context);
    const cancelled = await apiMutation(
      context.request,
      'put',
      `/api/admin/reservations/${created.body.reservation.id}/status`,
    )
      .set('Cookie', administratorCookie)
      .send({ status: 'cancelled' })
      .expect(200);
    expect(cancelled.body.reservation.status).toBe('cancelled');

    await reserve(context, {
      cookie: second.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);
  });

  it('rejects terminal, invalid, unknown-field, and missing status changes', async () => {
    const customer = await createCustomerSession(context);
    const created = await reserve(context, {
      cookie: customer.cookie,
      input: { ...reservationInput, roomId: room.id },
    }).expect(201);
    const administratorCookie = await createAdministratorSession(context);
    const path = `/api/admin/reservations/${created.body.reservation.id}/status`;

    await apiMutation(context.request, 'put', path)
      .set('Cookie', administratorCookie)
      .send({ status: 'cancelled' })
      .expect(200);
    const terminal = await apiMutation(context.request, 'put', path)
      .set('Cookie', administratorCookie)
      .send({ status: 'cancelled' })
      .expect(409);
    expect(terminal.body.error.code).toBe('INVALID_STATUS_TRANSITION');

    await apiMutation(context.request, 'put', path)
      .set('Cookie', administratorCookie)
      .send({ status: 'confirmed' })
      .expect(400);
    await apiMutation(context.request, 'put', path)
      .set('Cookie', administratorCookie)
      .send({ status: 'cancelled', note: 'not accepted' })
      .expect(400);
    await apiMutation(
      context.request,
      'put',
      '/api/admin/reservations/999999/status',
    )
      .set('Cookie', administratorCookie)
      .send({ status: 'cancelled' })
      .expect(404);
  });
});
