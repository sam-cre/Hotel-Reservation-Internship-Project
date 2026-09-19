import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  allowedOrigin,
  createAuthTestContext,
  createTestDatabase,
} from './helpers.js';

let context;
let database;

beforeAll(async () => {
  database = await createTestDatabase();
  context = createAuthTestContext({ database });
});

afterAll(async () => {
  await database.close();
});

describe('safe browser mutation guard', () => {
  it('allows a bodyless mutation such as logout', async () => {
    // The browser sends logout and the admin delete calls with no request body,
    // so no Content-Type header is present. These must not be rejected as 415.
    const response = await request(context.app)
      .post('/api/auth/logout')
      .set('Origin', allowedOrigin)
      .set('Sec-Fetch-Site', 'same-origin')
      .set('X-CSRF-Protection', '1');
    expect(response.status).toBe(204);
  });

  it('rejects a mutation whose body uses a non-JSON content type', async () => {
    const response = await request(context.app)
      .post('/api/auth/logout')
      .set('Origin', allowedOrigin)
      .set('Sec-Fetch-Site', 'same-origin')
      .set('X-CSRF-Protection', '1')
      .set('Content-Type', 'text/plain')
      .send('not json');
    expect(response.status).toBe(415);
  });

  it('still rejects a bodyless mutation missing the CSRF header', async () => {
    const response = await request(context.app)
      .post('/api/auth/logout')
      .set('Origin', allowedOrigin)
      .set('Sec-Fetch-Site', 'same-origin');
    expect(response.status).toBe(403);
  });

  it('still rejects a bodyless mutation from a disallowed origin', async () => {
    const response = await request(context.app)
      .post('/api/auth/logout')
      .set('Origin', 'https://evil.example')
      .set('Sec-Fetch-Site', 'cross-site')
      .set('X-CSRF-Protection', '1');
    expect(response.status).toBe(403);
  });
});
