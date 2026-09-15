import { SignJWT } from 'jose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createAuthTestContext,
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
  context = createAuthTestContext({
    database,
    configureRoutes(app, auth) {
      app.get(
        '/api/test/admin',
        auth.authenticate,
        auth.authorizeAdmin,
        (req, res) => res.json({ role: req.auth.user.role }),
      );
    },
  });
});

afterAll(async () => {
  await database.close();
});

describe('authorization', () => {
  it('denies missing authentication and customer access', async () => {
    await context.request.get('/api/test/admin').expect(401);
    const registered = await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const response = await context.request
      .get('/api/test/admin')
      .set('Cookie', sessionCookie(registered))
      .expect(403);
    expect(response.body.error.code).toBe('AUTHORIZATION_REQUIRED');
  });

  it('uses the current database role rather than token-time state', async () => {
    const registered = await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const cookie = sessionCookie(registered);
    const userId = registered.body.user.id;

    await context.database.query(
      "UPDATE users SET role = 'admin' WHERE id = $1",
      [userId],
    );
    const allowed = await context.request
      .get('/api/test/admin')
      .set('Cookie', cookie)
      .expect(200);
    expect(allowed.body).toEqual({ role: 'admin' });

    await context.database.query(
      "UPDATE users SET role = 'customer' WHERE id = $1",
      [userId],
    );
    await context.request
      .get('/api/test/admin')
      .set('Cookie', cookie)
      .expect(403);
  });

  it('ignores a signed role claim and uses the customer database role', async () => {
    const registered = await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(registered.body.user.id)
      .setIssuer(context.config.issuer)
      .setAudience(context.config.audience)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(context.config.secret));
    await context.request
      .get('/api/test/admin')
      .set('Cookie', `${context.config.cookieName}=${token}`)
      .expect(403);
  });

  it('rejects a token after its user no longer exists', async () => {
    const registered = await mutation(context.request, '/api/auth/register')
      .send(customerInput)
      .expect(201);
    const cookie = sessionCookie(registered);
    await context.database.query('DELETE FROM users WHERE id = $1', [
      registered.body.user.id,
    ]);
    await context.request
      .get('/api/test/admin')
      .set('Cookie', cookie)
      .expect(401);
  });
});
