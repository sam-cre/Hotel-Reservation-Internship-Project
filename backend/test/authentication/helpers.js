import { PGlite } from '@electric-sql/pglite';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { applyMigrations, loadMigrations } from '../../src/db/migrations.js';
import { migrationsDirectory } from '../../src/db/paths.js';

export const allowedOrigin = 'http://127.0.0.1:5173';

export function createTestAuthConfig(overrides = {}) {
  return {
    secret: 'test-only-signing-secret-at-least-32-characters',
    issuer: 'stillwater-api-test',
    audience: 'stillwater-web-test',
    ttlSeconds: 1800,
    cookieName: 'stillwater_session',
    secureCookie: false,
    allowedOrigins: new Set([allowedOrigin]),
    rateLimitWindowMs: 60000,
    rateLimitMax: 20,
    accountRateLimitWindowMs: 60000,
    accountRateLimitMax: 20,
    ...overrides,
  };
}

export async function createTestDatabase() {
  const database = new PGlite();
  const migrations = await loadMigrations(migrationsDirectory);
  await applyMigrations(database, migrations, { useAdvisoryLock: false });
  return database;
}

export function createAuthTestContext({
  database,
  config = createTestAuthConfig(),
  configureRoutes,
}) {
  const app = createApp({
    authentication: { database, config },
    configureRoutes,
    logError: () => {},
  });
  return { app, config, database, request: request(app) };
}

export function mutation(agent, path) {
  return agent
    .post(path)
    .set('Origin', allowedOrigin)
    .set('Sec-Fetch-Site', 'same-origin')
    .set('X-CSRF-Protection', '1');
}

export function sessionCookie(response) {
  return response.headers['set-cookie'][0].split(';', 1)[0];
}

export const customerInput = Object.freeze({
  name: 'Ada Rivera',
  email: 'ada@example.com',
  password: 'correct-horse-battery-staple',
});
