import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
  apiMutation,
  createAdministratorSession,
  createCustomerSession,
  createTestDatabase,
  findRoom,
  resetCatalogDatabase,
  testNow,
} from '../catalog/helpers.js';
import { createTestAuthConfig } from '../authentication/helpers.js';

export const reservationInput = Object.freeze({
  checkIn: '2026-10-10',
  checkOut: '2026-10-13',
  guests: 2,
});

export function createReservationTestContext(database) {
  const config = createTestAuthConfig();
  const app = createApp({
    database,
    authentication: { database, config },
    catalogNow: () => testNow,
    reservationNow: () => testNow,
    logError: () => {},
  });
  return { app, config, database, request: request(app) };
}

export function reserve(
  context,
  { cookie, input, idempotencyKey = randomUUID() },
) {
  return apiMutation(context.request, 'post', '/api/reservations')
    .set('Cookie', cookie)
    .set('Idempotency-Key', idempotencyKey)
    .send(input);
}

export async function batteryRoom(database, name = 'Harbor View King') {
  return findRoom(database, 'The Battery', name);
}

export {
  apiMutation,
  createAdministratorSession,
  createCustomerSession,
  createTestDatabase,
  randomUUID,
  resetCatalogDatabase,
};
