import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { developmentSeedPath } from '../../src/db/paths.js';
import {
  allowedOrigin,
  createTestAuthConfig,
  createTestDatabase,
  customerInput,
  mutation,
  sessionCookie,
} from '../authentication/helpers.js';

export const testNow = new Date('2026-09-15T12:00:00.000Z');
export const stay = Object.freeze({
  checkIn: '2026-10-10',
  checkOut: '2026-10-13',
  guests: 2,
});

export const hotelInput = Object.freeze({
  name: 'The Meridian',
  description: 'A full-service city hotel with generous public rooms.',
  city: 'Atlanta',
  address: '100 Peachtree Street, Atlanta, GA',
  rating: 4.6,
  imageUrl: 'https://images.example/meridian.jpg',
});

export const roomInput = Object.freeze({
  name: 'Skyline King',
  description: 'One king bed with a broad view of the city.',
  pricePerNight: 375,
  capacity: 2,
  totalRooms: 5,
});

export async function resetCatalogDatabase(database) {
  await database.query(
    'TRUNCATE reservations, rooms, hotels, users RESTART IDENTITY CASCADE',
  );
  await database.exec(await readFile(developmentSeedPath, 'utf8'));
}

export function createCatalogTestContext(database) {
  const config = createTestAuthConfig();
  const app = createApp({
    database,
    authentication: { database, config },
    catalogNow: () => testNow,
    logError: () => {},
  });
  return { app, config, database, request: request(app) };
}

export function apiMutation(agent, method, path) {
  return agent[method](path)
    .set('Origin', allowedOrigin)
    .set('Sec-Fetch-Site', 'same-origin')
    .set('X-CSRF-Protection', '1');
}

export async function createCustomerSession(context, overrides = {}) {
  const input = { ...customerInput, ...overrides };
  const response = await mutation(context.request, '/api/auth/register')
    .send(input)
    .expect(201);
  return {
    cookie: sessionCookie(response),
    user: response.body.user,
  };
}

export async function createAdministratorSession(context) {
  const session = await createCustomerSession(context, {
    name: 'Morgan Lee',
    email: 'admin-test@example.com',
  });
  await context.database.query(
    "UPDATE users SET role = 'admin' WHERE id = $1",
    [session.user.id],
  );
  return session.cookie;
}

export async function findRoom(database, hotelName, roomName) {
  const result = await database.query(
    `SELECT r.id::text, r.price_per_night
     FROM rooms r
     JOIN hotels h ON h.id = r.hotel_id
     WHERE h.name = $1 AND r.name = $2`,
    [hotelName, roomName],
  );
  return result.rows[0];
}

export async function insertReservation(
  database,
  { userId, roomId, checkIn, checkOut, guests = 2, status = 'confirmed' },
) {
  await database.query(
    `INSERT INTO reservations
       (user_id, room_id, check_in, check_out, guests,
        price_per_night_snapshot, total_price, status,
        idempotency_key, request_fingerprint)
     VALUES ($1, $2, $3, $4, $5, 100.00, 300.00, $6, $7, $8)`,
    [
      userId,
      roomId,
      checkIn,
      checkOut,
      guests,
      status,
      randomUUID(),
      'a'.repeat(64),
    ],
  );
}

export { createTestDatabase };
