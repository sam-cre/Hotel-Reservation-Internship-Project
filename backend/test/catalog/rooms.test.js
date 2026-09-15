import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  apiMutation,
  createAdministratorSession,
  createCatalogTestContext,
  createCustomerSession,
  createTestDatabase,
  findRoom,
  insertReservation,
  resetCatalogDatabase,
  roomInput,
} from './helpers.js';

let context;
let database;
let batteryId;

beforeAll(async () => {
  database = await createTestDatabase();
});

beforeEach(async () => {
  await resetCatalogDatabase(database);
  context = createCatalogTestContext(database);
  const hotel = await database.query(
    "SELECT id::text FROM hotels WHERE name = 'The Battery'",
  );
  batteryId = hotel.rows[0].id;
});

afterAll(async () => {
  await database.close();
});

describe('public room types', () => {
  it('lists active room types in price order', async () => {
    const response = await context.request
      .get(`/api/hotels/${batteryId}/rooms`)
      .expect(200);
    expect(response.body.rooms.map((room) => room.name)).toEqual([
      'Harbor View King',
      'Terrace Suite',
    ]);
    expect(response.body.rooms[0]).toMatchObject({
      pricePerNight: '465.00',
      capacity: 2,
      totalRooms: 8,
    });
  });

  it('returns 404 for missing and inactive hotels', async () => {
    await context.request.get('/api/hotels/999999/rooms').expect(404);
    await database.query('UPDATE hotels SET is_active = false WHERE id = $1', [
      batteryId,
    ]);
    await context.request.get(`/api/hotels/${batteryId}/rooms`).expect(404);
  });
});

describe('administrator room management', () => {
  it('creates, replaces, and soft-deletes a room type', async () => {
    const cookie = await createAdministratorSession(context);
    const created = await apiMutation(
      context.request,
      'post',
      `/api/hotels/${batteryId}/rooms`,
    )
      .set('Cookie', cookie)
      .send(roomInput)
      .expect(201);
    expect(created.body.room).toMatchObject({
      ...roomInput,
      pricePerNight: '375.00',
      hotelId: batteryId,
      isActive: true,
    });

    const replacement = {
      ...roomInput,
      name: 'Skyline Double',
      pricePerNight: 410.5,
      capacity: 4,
    };
    const updated = await apiMutation(
      context.request,
      'put',
      `/api/rooms/${created.body.room.id}`,
    )
      .set('Cookie', cookie)
      .send(replacement)
      .expect(200);
    expect(updated.body.room).toMatchObject({
      name: 'Skyline Double',
      pricePerNight: '410.50',
      capacity: 4,
    });

    await apiMutation(
      context.request,
      'delete',
      `/api/rooms/${created.body.room.id}`,
    )
      .set('Cookie', cookie)
      .send({})
      .expect(204);
    const state = await database.query(
      'SELECT is_active FROM rooms WHERE id = $1',
      [created.body.room.id],
    );
    expect(state.rows[0].is_active).toBe(false);
  });

  it('rejects customers, inactive hotels, invalid fields, and duplicates', async () => {
    const customer = await createCustomerSession(context);
    await apiMutation(context.request, 'post', `/api/hotels/${batteryId}/rooms`)
      .set('Cookie', customer.cookie)
      .send(roomInput)
      .expect(403);

    const cookie = await createAdministratorSession(context);
    const invalid = await apiMutation(
      context.request,
      'post',
      `/api/hotels/${batteryId}/rooms`,
    )
      .set('Cookie', cookie)
      .send({ ...roomInput, totalRooms: 0, pricePerNight: 12.345 })
      .expect(400);
    expect(invalid.body.error.details.fields).toEqual(
      expect.arrayContaining(['totalRooms', 'pricePerNight']),
    );

    const duplicate = await apiMutation(
      context.request,
      'post',
      `/api/hotels/${batteryId}/rooms`,
    )
      .set('Cookie', cookie)
      .send({ ...roomInput, name: 'Harbor View King' })
      .expect(409);
    expect(duplicate.body.error.code).toBe('ROOM_ALREADY_EXISTS');

    await database.query('UPDATE hotels SET is_active = false WHERE id = $1', [
      batteryId,
    ]);
    await apiMutation(context.request, 'post', `/api/hotels/${batteryId}/rooms`)
      .set('Cookie', cookie)
      .send(roomInput)
      .expect(404);
  });

  it('rejects inventory and capacity reductions that contradict future reservations', async () => {
    const administratorCookie = await createAdministratorSession(context);
    const customer = await createCustomerSession(context, {
      email: 'reservation-owner@example.com',
    });
    const room = await findRoom(database, 'The Battery', 'Terrace Suite');
    await database.query('UPDATE rooms SET total_rooms = 1 WHERE id = $1', [
      room.id,
    ]);
    await insertReservation(database, {
      userId: customer.user.id,
      roomId: room.id,
      checkIn: '2026-10-10',
      checkOut: '2026-10-13',
      guests: 4,
    });

    const response = await apiMutation(
      context.request,
      'put',
      `/api/rooms/${room.id}`,
    )
      .set('Cookie', administratorCookie)
      .send({
        name: 'Terrace Suite',
        description: 'Updated suite description.',
        pricePerNight: 700,
        capacity: 2,
        totalRooms: 1,
      })
      .expect(409);
    expect(response.body.error.code).toBe('ROOM_INVENTORY_CONFLICT');
  });

  it('keeps historical room rows after deactivation', async () => {
    const cookie = await createAdministratorSession(context);
    const room = await findRoom(database, 'The Battery', 'Harbor View King');
    await apiMutation(context.request, 'delete', `/api/rooms/${room.id}`)
      .set('Cookie', cookie)
      .send({})
      .expect(204);
    const row = await database.query(
      'SELECT id::text FROM rooms WHERE id = $1',
      [room.id],
    );
    expect(row.rows[0].id).toBe(room.id);
    const list = await context.request
      .get(`/api/hotels/${batteryId}/rooms`)
      .expect(200);
    expect(list.body.rooms.map((item) => item.name)).not.toContain(
      'Harbor View King',
    );
  });

  it('returns stable 404 errors for missing room mutations', async () => {
    const cookie = await createAdministratorSession(context);
    await apiMutation(context.request, 'put', '/api/rooms/999999')
      .set('Cookie', cookie)
      .send(roomInput)
      .expect(404);
    await apiMutation(context.request, 'delete', '/api/rooms/999999')
      .set('Cookie', cookie)
      .send({})
      .expect(404);
  });
});
