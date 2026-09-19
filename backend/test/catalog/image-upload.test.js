import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  apiMutation,
  createAdministratorSession,
  createCatalogTestContext,
  createCustomerSession,
  createTestDatabase,
  resetCatalogDatabase,
} from './helpers.js';

// A 1x1 transparent PNG; its bytes carry a genuine PNG signature.
const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

let context;
let database;

beforeAll(async () => {
  database = await createTestDatabase();
});

beforeEach(async () => {
  await resetCatalogDatabase(database);
  context = createCatalogTestContext(database);
});

afterAll(async () => {
  await database.close();
});

describe('hotel image uploads', () => {
  it('requires authentication and the administrator role', async () => {
    await apiMutation(context.request, 'post', '/api/admin/images')
      .send({ contentType: 'image/png', data: pngBase64 })
      .expect(401);
    const customer = await createCustomerSession(context);
    await apiMutation(context.request, 'post', '/api/admin/images')
      .set('Cookie', customer.cookie)
      .send({ contentType: 'image/png', data: pngBase64 })
      .expect(403);
  });

  it('stores a valid image and serves it back with caching', async () => {
    const cookie = await createAdministratorSession(context);
    const upload = await apiMutation(
      context.request,
      'post',
      '/api/admin/images',
    )
      .set('Cookie', cookie)
      .send({ contentType: 'image/png', data: pngBase64 })
      .expect(201);
    expect(upload.body.url).toMatch(/^\/api\/images\/\d+$/);

    const served = await context.request.get(upload.body.url).expect(200);
    expect(served.headers['content-type']).toMatch(/^image\/png/);
    expect(served.headers['cache-control']).toContain('immutable');
    expect(Number(served.headers['content-length'])).toBe(
      Buffer.from(pngBase64, 'base64').length,
    );
  });

  it('rejects bytes that do not match the declared content type', async () => {
    const cookie = await createAdministratorSession(context);
    const response = await apiMutation(
      context.request,
      'post',
      '/api/admin/images',
    )
      .set('Cookie', cookie)
      .send({
        contentType: 'image/png',
        data: Buffer.from('hello').toString('base64'),
      })
      .expect(400);
    expect(response.body.error.code).toBe('INVALID_IMAGE');
  });

  it('rejects a malformed base64 payload before decoding', async () => {
    const cookie = await createAdministratorSession(context);
    const response = await apiMutation(
      context.request,
      'post',
      '/api/admin/images',
    )
      .set('Cookie', cookie)
      .send({ contentType: 'image/png', data: 'not base64 data!!' })
      .expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts an upload larger than the strict global body limit', async () => {
    // Proves app.js skips the 16 KB global JSON parser for this route so the
    // route's own 8 MB parser handles a real image payload.
    const cookie = await createAdministratorSession(context);
    const signature = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const bytes = Buffer.concat([signature, Buffer.alloc(40000, 0)]);
    const response = await apiMutation(
      context.request,
      'post',
      '/api/admin/images',
    )
      .set('Cookie', cookie)
      .send({ contentType: 'image/png', data: bytes.toString('base64') })
      .expect(201);
    expect(response.body.url).toMatch(/^\/api\/images\/\d+$/);
  });

  it('returns 404 for an image that does not exist', async () => {
    await context.request.get('/api/images/999999').expect(404);
  });
});
