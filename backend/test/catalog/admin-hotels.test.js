import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  apiMutation,
  createAdministratorSession,
  createCatalogTestContext,
  createCustomerSession,
  createTestDatabase,
  hotelInput,
  resetCatalogDatabase,
} from './helpers.js';

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

describe('administrator hotel listing', () => {
  it('requires authentication and the administrator role', async () => {
    await context.request.get('/api/admin/hotels').expect(401);
    const customer = await createCustomerSession(context);
    await context.request
      .get('/api/admin/hotels')
      .set('Cookie', customer.cookie)
      .expect(403);
  });

  it('includes newly created hotels that have no rooms yet', async () => {
    const cookie = await createAdministratorSession(context);
    await apiMutation(context.request, 'post', '/api/hotels')
      .set('Cookie', cookie)
      .send({ ...hotelInput, name: 'The Roomless', city: 'Denver' })
      .expect(201);

    const response = await context.request
      .get('/api/admin/hotels')
      .set('Cookie', cookie)
      .expect(200);

    const names = response.body.hotels.map((hotel) => hotel.name);
    expect(names).toContain('The Roomless');
    // The public search inner-joins rooms, so the roomless hotel is hidden there.
    const publicNames = (
      await context.request.get('/api/hotels').expect(200)
    ).body.hotels.map((hotel) => hotel.name);
    expect(publicNames).not.toContain('The Roomless');

    const roomless = response.body.hotels.find(
      (hotel) => hotel.name === 'The Roomless',
    );
    expect(roomless.startingPrice).toBeNull();
    const withRooms = response.body.hotels.find(
      (hotel) => hotel.name === 'The Battery',
    );
    expect(withRooms.startingPrice).not.toBeNull();
  });
});
