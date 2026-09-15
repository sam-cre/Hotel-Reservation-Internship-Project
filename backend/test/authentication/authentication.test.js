import argon2 from 'argon2';
import { SignJWT } from 'jose';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createApp } from '../../src/app.js';
import { readAuthenticationEnvironment } from '../../src/config/authentication.js';
import {
  allowedOrigin,
  createAuthTestContext,
  createTestAuthConfig,
  createTestDatabase,
  customerInput,
  mutation,
  sessionCookie,
} from './helpers.js';

let context;
let database;

beforeAll(async () => {
  database = await createTestDatabase();
});

beforeEach(async () => {
  await database.query('TRUNCATE users RESTART IDENTITY CASCADE');
  context = createAuthTestContext({ database });
});

afterAll(async () => {
  await database.close();
});

describe('authentication configuration', () => {
  it('requires secret and origin settings without exposing their values', () => {
    expect(() => readAuthenticationEnvironment({})).toThrow(
      'Invalid authentication configuration: JWT_SECRET, ALLOWED_ORIGINS',
    );
    expect(() =>
      readAuthenticationEnvironment({
        JWT_SECRET: 'short-private-value',
        ALLOWED_ORIGINS: '*',
      }),
    ).toThrow('Invalid authentication configuration: JWT_SECRET');
  });

  it('normalizes validated settings and enables secure production cookies', () => {
    const result = readAuthenticationEnvironment({
      NODE_ENV: 'production',
      JWT_SECRET: 'a'.repeat(32),
      ALLOWED_ORIGINS: 'https://stillwater.example',
    });
    expect(result.secureCookie).toBe(true);
    expect(result.allowedOrigins).toEqual(
      new Set(['https://stillwater.example']),
    );
    expect(result.ttlSeconds).toBe(1800);
    expect(() =>
      readAuthenticationEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'a'.repeat(32),
        ALLOWED_ORIGINS: 'http://stillwater.example',
      }),
    ).toThrow('Invalid authentication configuration: ALLOWED_ORIGINS');
  });
});

describe('registration and sessions', () => {
  it('creates only a customer and never returns password material', async () => {
    const response = await mutation(context.request, '/api/auth/register')
      .send({ ...customerInput, role: 'admin' })
      .expect(400);
    expect(response.body.error.details.fields).toContain('role');

    const registered = await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    expect(registered.body.user).toMatchObject({
      name: customerInput.name,
      email: customerInput.email,
      role: 'customer',
    });
    expect(JSON.stringify(registered.body)).not.toMatch(/password|hash/i);

    const stored = await context.database.query(
      'SELECT role, password FROM users WHERE email = $1',
      [customerInput.email],
    );
    expect(stored.rows[0].role).toBe('customer');
    await expect(
      argon2.verify(stored.rows[0].password, customerInput.password),
    ).resolves.toBe(true);
  });

  it('uses the required production login cookie attributes', async () => {
    context = createAuthTestContext({
      database,
      config: createTestAuthConfig({ secureCookie: true }),
    });
    await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const response = await mutation(context.request, '/api/auth/login')
      .send({
        email: customerInput.email,
        password: customerInput.password,
      })
      .expect(200);
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=1800');
    expect(response.text).not.toContain(cookie.split('=', 2)[1]);
  });

  it('restores the current user and expires the same cookie on logout', async () => {
    const registered = await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const cookie = sessionCookie(registered);
    const current = await context.request
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    expect(current.body.user.email).toBe(customerInput.email);

    const logout = await mutation(context.request, '/api/auth/logout')
      .set('Cookie', cookie)
      .send({})
      .expect(204);
    expect(logout.headers['set-cookie'][0]).toContain(
      `${context.config.cookieName}=`,
    );
    expect(logout.headers['set-cookie'][0]).toContain('Max-Age=0');
  });

  it('rejects missing and expired sessions with the same safe response', async () => {
    const missing = await context.request.get('/api/auth/me').expect(401);
    const key = new TextEncoder().encode(context.config.secret);
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('1')
      .setIssuer(context.config.issuer)
      .setAudience(context.config.audience)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(key);
    const expiredResponse = await context.request
      .get('/api/auth/me')
      .set('Cookie', `${context.config.cookieName}=${expired}`)
      .expect(401);
    expect(expiredResponse.body.error).toMatchObject({
      code: missing.body.error.code,
      message: missing.body.error.message,
    });
  });

  it.each([
    ['wrong issuer', { issuer: 'another-api' }, undefined],
    ['wrong audience', { audience: 'another-client' }, undefined],
    [
      'wrong signature',
      {},
      'different-test-signing-secret-at-least-32-characters',
    ],
  ])('rejects a token with %s', async (_label, claims, signingSecret) => {
    const registered = await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const key = new TextEncoder().encode(
      signingSecret ?? context.config.secret,
    );
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(registered.body.user.id)
      .setIssuer(claims.issuer ?? context.config.issuer)
      .setAudience(claims.audience ?? context.config.audience)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(key);
    await context.request
      .get('/api/auth/me')
      .set('Cookie', `${context.config.cookieName}=${token}`)
      .expect(401);
  });

  it('fails closed without exposing a database error', async () => {
    const logError = vi.fn();
    const app = createApp({
      authentication: {
        config: context.config,
        database: {
          query: async () => {
            throw new Error('sensitive database detail');
          },
        },
      },
      logError,
    });
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('1')
      .setIssuer(context.config.issuer)
      .setAudience(context.config.audience)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(context.config.secret));
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${context.config.cookieName}=${token}`)
      .expect(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.text).not.toContain('sensitive database detail');
    expect(logError).toHaveBeenCalledWith({
      event: 'request_failed',
      requestId: response.headers['x-request-id'],
    });
  });
});

describe('login safety', () => {
  it('uses one public failure for an unknown email and wrong password', async () => {
    await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const unknown = await mutation(context.request, '/api/auth/login')
      .send({
        email: 'unknown@example.com',
        password: customerInput.password,
      })
      .expect(401);
    const wrong = await mutation(context.request, '/api/auth/login')
      .send({
        email: customerInput.email,
        password: 'this-password-is-not-correct',
      })
      .expect(401);
    expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrong.body.error.code).toBe(unknown.body.error.code);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('normalizes email and returns a session after valid credentials', async () => {
    await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const response = await mutation(context.request, '/api/auth/login')
      .send({
        email: '  ADA@EXAMPLE.COM ',
        password: customerInput.password,
      })
      .expect(200);
    expect(response.body.user.email).toBe(customerInput.email);
    expect(sessionCookie(response)).toMatch(/^stillwater_session=/);
  });
});

describe('browser mutation defenses and rate limits', () => {
  it.each([
    ['missing CSRF header', { Origin: allowedOrigin }],
    ['missing origin', { 'X-CSRF-Protection': '1' }],
    [
      'foreign origin',
      { Origin: 'https://attacker.example', 'X-CSRF-Protection': '1' },
    ],
    [
      'cross-site metadata',
      {
        Origin: allowedOrigin,
        'X-CSRF-Protection': '1',
        'Sec-Fetch-Site': 'cross-site',
      },
    ],
  ])('rejects %s', async (_label, headers) => {
    const response = await context.request
      .post('/api/auth/register')
      .set(headers)
      .send(customerInput)
      .expect(403);
    expect(response.body.error.code).toBe('REQUEST_FORBIDDEN');
  });

  it('requires JSON for state-changing requests', async () => {
    const response = await context.request
      .post('/api/auth/login')
      .set('Origin', allowedOrigin)
      .set('X-CSRF-Protection', '1')
      .type('form')
      .send({ email: customerInput.email, password: customerInput.password })
      .expect(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('bounds repeated authentication work', async () => {
    context = createAuthTestContext({
      database,
      config: createTestAuthConfig({ rateLimitMax: 2 }),
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await mutation(context.request, '/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: customerInput.password,
        })
        .expect(401);
    }
    const limited = await mutation(context.request, '/api/auth/login')
      .send({
        email: 'unknown@example.com',
        password: customerInput.password,
      })
      .expect(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
    expect(limited.headers['ratelimit-policy']).toBeDefined();
  });
});
