import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createCatalogTestContext,
  createCustomerSession,
  createTestDatabase,
  findRoom,
  insertReservation,
  resetCatalogDatabase,
  stay,
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

describe('room availability', () => {
  it('reports remaining inventory and server-computed stay totals', async () => {
    const response = await context.request
      .get(`/api/hotels/${batteryId}/rooms`)
      .query(stay)
      .expect(200);

    expect(response.body.rooms).toEqual([
      expect.objectContaining({
        name: 'Harbor View King',
        remainingRooms: 8,
        available: true,
        estimatedTotal: '1395.00',
      }),
      expect.objectContaining({
        name: 'Terrace Suite',
        remainingRooms: 3,
        available: true,
        estimatedTotal: '2085.00',
      }),
    ]);
  });

  it('returns only room types that fit the guest count and have inventory', async () => {
    const harborRoom = await findRoom(
      database,
      'The Battery',
      'Harbor View King',
    );
    await database.query('UPDATE rooms SET total_rooms = 1 WHERE id = $1', [
      harborRoom.id,
    ]);
    const customer = await createCustomerSession(context);
    await insertReservation(database, {
      userId: customer.user.id,
      roomId: harborRoom.id,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
    });

    const response = await context.request
      .get('/api/rooms/availability')
      .query({ hotelId: batteryId, ...stay })
      .expect(200);

    expect(response.body.criteria).toEqual({ hotelId: batteryId, ...stay });
    expect(response.body.rooms.map((room) => room.name)).toEqual([
      'Terrace Suite',
    ]);
  });

  it('uses half-open dates so checkout does not block the next check-in', async () => {
    const harborRoom = await findRoom(
      database,
      'The Battery',
      'Harbor View King',
    );
    await database.query('UPDATE rooms SET total_rooms = 1 WHERE id = $1', [
      harborRoom.id,
    ]);
    const customer = await createCustomerSession(context);
    await insertReservation(database, {
      userId: customer.user.id,
      roomId: harborRoom.id,
      checkIn: '2026-10-07',
      checkOut: stay.checkIn,
    });

    const response = await context.request
      .get('/api/rooms/availability')
      .query({ hotelId: batteryId, ...stay })
      .expect(200);

    expect(response.body.rooms.map((room) => room.name)).toContain(
      'Harbor View King',
    );
  });

  it('does not count cancelled reservations against inventory', async () => {
    const harborRoom = await findRoom(
      database,
      'The Battery',
      'Harbor View King',
    );
    await database.query('UPDATE rooms SET total_rooms = 1 WHERE id = $1', [
      harborRoom.id,
    ]);
    const customer = await createCustomerSession(context);
    await insertReservation(database, {
      userId: customer.user.id,
      roomId: harborRoom.id,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      status: 'cancelled',
    });

    const response = await context.request
      .get('/api/rooms/availability')
      .query({ hotelId: batteryId, ...stay })
      .expect(200);

    expect(response.body.rooms.map((room) => room.name)).toContain(
      'Harbor View King',
    );
  });

  it('filters hotel search and recomputes starting price from available rooms', async () => {
    const harborRoom = await findRoom(
      database,
      'The Battery',
      'Harbor View King',
    );
    await database.query('UPDATE rooms SET total_rooms = 1 WHERE id = $1', [
      harborRoom.id,
    ]);
    const customer = await createCustomerSession(context);
    await insertReservation(database, {
      userId: customer.user.id,
      roomId: harborRoom.id,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
    });

    const response = await context.request
      .get('/api/hotels')
      .query({ city: 'Charleston', ...stay })
      .expect(200);
    const battery = response.body.hotels.find(
      (hotel) => hotel.name === 'The Battery',
    );
    expect(battery.startingPrice).toBe('695.00');

    const fourGuestSearch = await context.request
      .get('/api/hotels')
      .query({ city: 'Charleston', ...stay, guests: 5 })
      .expect(200);
    expect(fourGuestSearch.body.hotels).toEqual([]);
  });

  it('rejects missing, malformed, past, reversed, and unknown criteria', async () => {
    const cases = [
      { hotelId: batteryId, checkIn: stay.checkIn, checkOut: stay.checkOut },
      { hotelId: '0', ...stay },
      { hotelId: batteryId, ...stay, checkIn: '2026-09-14' },
      { hotelId: batteryId, ...stay, checkOut: stay.checkIn },
      { hotelId: batteryId, ...stay, extra: 'value' },
    ];
    for (const query of cases) {
      const response = await context.request
        .get('/api/rooms/availability')
        .query(query)
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('returns a stable not-found response for an unknown hotel', async () => {
    const response = await context.request
      .get('/api/rooms/availability')
      .query({ hotelId: '999999', ...stay })
      .expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
