import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  apiMutation,
  createAdministratorSession,
  createCatalogTestContext,
  createCustomerSession,
  createTestDatabase,
  hotelInput,
  resetCatalogDatabase,
  stay,
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

describe('public hotels', () => {
  it('lists active hotels with a server-computed starting price', async () => {
    const response = await context.request.get('/api/hotels').expect(200);
    expect(response.body.hotels).toHaveLength(3);
    expect(response.body.hotels[0]).toMatchObject({
      name: 'The Battery',
      city: 'Charleston',
      startingPrice: '465.00',
      isActive: true,
    });
  });

  it('uses case-insensitive exact city search', async () => {
    const response = await context.request
      .get('/api/hotels')
      .query({ city: '  charleston  ' })
      .expect(200);
    expect(response.body.hotels.map((hotel) => hotel.name)).toEqual([
      'The Battery',
      'The Calhoun',
    ]);
  });

  it('returns only hotels with qualifying available rooms for a complete stay', async () => {
    const response = await context.request
      .get('/api/hotels')
      .query({ ...stay, guests: 4, city: 'Charleston' })
      .expect(200);
    expect(response.body.hotels).toEqual([
      expect.objectContaining({
        name: 'The Battery',
        startingPrice: '695.00',
      }),
      expect.objectContaining({
        name: 'The Calhoun',
        startingPrice: '445.00',
      }),
    ]);
  });

  it('rejects partial, past, reversed, unknown, and malformed criteria', async () => {
    const cases = [
      { checkIn: stay.checkIn },
      { ...stay, checkIn: '2026-09-14' },
      { ...stay, checkOut: stay.checkIn },
      { ...stay, extra: 'value' },
      { ...stay, checkIn: '2026-02-30' },
    ];
    for (const query of cases) {
      const response = await context.request
        .get('/api/hotels')
        .query(query)
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('returns one active hotel and hides missing or inactive hotels', async () => {
    const idResult = await database.query(
      "SELECT id::text FROM hotels WHERE name = 'The Battery'",
    );
    const id = idResult.rows[0].id;
    const response = await context.request.get(`/api/hotels/${id}`).expect(200);
    expect(response.body.hotel.name).toBe('The Battery');

    await database.query('UPDATE hotels SET is_active = false WHERE id = $1', [
      id,
    ]);
    await context.request.get(`/api/hotels/${id}`).expect(404);
    await context.request.get('/api/hotels/999999').expect(404);
  });
});

describe('administrator hotel management', () => {
  it('requires authentication and the current administrator role', async () => {
    await apiMutation(context.request, 'post', '/api/hotels')
      .send(hotelInput)
      .expect(401);
    const customer = await createCustomerSession(context);
    await apiMutation(context.request, 'post', '/api/hotels')
      .set('Cookie', customer.cookie)
      .send(hotelInput)
      .expect(403);
  });

  it('creates and replaces a hotel from strict validated fields', async () => {
    const cookie = await createAdministratorSession(context);
    const created = await apiMutation(context.request, 'post', '/api/hotels')
      .set('Cookie', cookie)
      .send(hotelInput)
      .expect(201);
    expect(created.body.hotel).toMatchObject({
      ...hotelInput,
      rating: '4.6',
      isActive: true,
    });
    expect(created.body.hotel.amenities).toEqual(hotelInput.amenities);

    const replacement = {
      ...hotelInput,
      name: 'The Meridian Grand',
      rating: 4.8,
    };
    const updated = await apiMutation(
      context.request,
      'put',
      `/api/hotels/${created.body.hotel.id}`,
    )
      .set('Cookie', cookie)
      .send(replacement)
      .expect(200);
    expect(updated.body.hotel).toMatchObject({
      name: replacement.name,
      rating: '4.8',
    });
  });

  it('defaults amenities to an empty list when none are provided', async () => {
    const cookie = await createAdministratorSession(context);
    const { amenities, ...withoutAmenities } = hotelInput;
    void amenities;
    const created = await apiMutation(context.request, 'post', '/api/hotels')
      .set('Cookie', cookie)
      .send({ ...withoutAmenities, name: 'The Understated' })
      .expect(201);
    expect(created.body.hotel.amenities).toEqual([]);
  });

  it('rejects unknown fields, invalid values, and duplicate hotel identity', async () => {
    const cookie = await createAdministratorSession(context);
    const invalid = await apiMutation(context.request, 'post', '/api/hotels')
      .set('Cookie', cookie)
      .send({ ...hotelInput, rating: 4.65, isActive: true })
      .expect(400);
    expect(invalid.body.error.details.fields).toEqual(
      expect.arrayContaining(['rating', 'isActive']),
    );

    const duplicate = await apiMutation(context.request, 'post', '/api/hotels')
      .set('Cookie', cookie)
      .send({ ...hotelInput, name: 'The Battery', city: 'Charleston' })
      .expect(409);
    expect(duplicate.body.error.code).toBe('HOTEL_ALREADY_EXISTS');
  });

  it('soft-deletes a hotel and its rooms without destroying references', async () => {
    const cookie = await createAdministratorSession(context);
    const target = await database.query(
      "SELECT id::text FROM hotels WHERE name = 'The Battery'",
    );
    const hotelId = target.rows[0].id;
    await apiMutation(context.request, 'delete', `/api/hotels/${hotelId}`)
      .set('Cookie', cookie)
      .send({})
      .expect(204);

    const state = await database.query(
      `SELECT
         (SELECT is_active FROM hotels WHERE id = $1) AS hotel_active,
         (SELECT bool_or(is_active) FROM rooms WHERE hotel_id = $1) AS any_room_active`,
      [hotelId],
    );
    expect(state.rows[0]).toEqual({
      hotel_active: false,
      any_room_active: false,
    });
    const publicList = await context.request
      .get('/api/hotels')
      .query({ city: 'Charleston' })
      .expect(200);
    expect(publicList.body.hotels.map((hotel) => hotel.name)).toEqual([
      'The Calhoun',
    ]);
  });
});
