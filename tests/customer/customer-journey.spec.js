import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const hotel = {
  id: '11',
  name: 'The Battery',
  city: 'Charleston',
  address: '18 East Bay Street, Charleston, SC',
  description: 'A full-service waterfront hotel with broad harbor views.',
  rating: '4.9',
  imageUrl: '/images/battery-terrace.jpg',
  startingPrice: '465.00',
};

const room = {
  id: '21',
  hotelId: '11',
  name: 'Harbor View King',
  description: 'One king bed with a harbor-facing sitting area.',
  pricePerNight: '465.00',
  estimatedTotal: '1395.00',
  capacity: 2,
  remainingRooms: 3,
  available: true,
};

function dates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 21);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  return {
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
  };
}

async function mockApi(page) {
  let user = null;
  let reservation = null;
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path === '/api/auth/me') {
      return user
        ? json({ user })
        : json(
            {
              error: {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Sign in is required.',
              },
            },
            401,
          );
    }
    if (path === '/api/auth/register' || path === '/api/auth/login') {
      user = {
        id: '1',
        name: 'Sam Guest',
        email: 'sam@example.com',
        role: 'customer',
      };
      return json({ user }, path.endsWith('register') ? 201 : 200);
    }
    if (path === '/api/auth/logout') return route.fulfill({ status: 204 });
    if (path === '/api/hotels/11/rooms') return json({ rooms: [room] });
    if (path === '/api/hotels/11') return json({ hotel });
    if (path === '/api/hotels') return json({ hotels: [hotel] });
    if (path === '/api/reservations' && request.method() === 'POST') {
      const input = request.postDataJSON();
      expect(Object.keys(input).sort()).toEqual([
        'checkIn',
        'checkOut',
        'guests',
        'roomId',
      ]);
      expect(request.headers()['idempotency-key']).toBeTruthy();
      reservation = {
        id: '31',
        ...input,
        pricePerNight: '465.00',
        totalPrice: '1395.00',
        status: 'confirmed',
        hotel: { id: '11', name: 'The Battery', city: 'Charleston' },
        room: { id: '21', name: 'Harbor View King' },
      };
      return json({ reservation }, 201);
    }
    if (path === '/api/reservations/my')
      return json({ reservations: reservation ? [reservation] : [] });
    if (path === '/api/reservations/31') return json({ reservation });
    return json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }, 404);
  });
}

test('customer-journey books a server-priced room and retrieves confirmation', async ({
  page,
}) => {
  await mockApi(page);
  const stay = dates();
  await page.goto(
    `/search?city=Charleston&checkIn=${stay.checkIn}&checkOut=${stay.checkOut}&guests=2`,
  );
  await page.getByRole('button', { name: 'Use essential only' }).click();

  await expect(
    page.getByRole('heading', { name: 'The Battery' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /view rooms/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Harbor View King' }),
  ).toBeVisible();
  await expect(page.getByText(/\$1,395/)).toBeVisible();
  await page.getByRole('link', { name: 'Review this room' }).click();

  await expect(
    page.getByRole('heading', { name: 'Welcome back.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Create an account' }).click();
  await page.getByLabel('Full name').fill('Sam Guest');
  await page.getByLabel('Email address').fill('sam@example.com');
  await page.getByLabel('Password').fill('long-password-123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(
    page.getByRole('heading', { name: 'Review your stay.' }),
  ).toBeVisible();
  await expect(page.getByText(/\$1,395/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm reservation' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your room is waiting.' }),
  ).toBeVisible();
  await expect(page.getByText('Reservation 31')).toBeVisible();
  await page.getByRole('link', { name: 'View all reservations' }).click();
  await expect(
    page.getByRole('heading', { name: 'My reservations.' }),
  ).toBeVisible();
  await expect(page.getByText('Harbor View King')).toBeVisible();
});

test('customer-journey remains accessible and free of horizontal overflow', async ({
  page,
}) => {
  await mockApi(page);
  const stay = dates();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(
    `/search?city=Charleston&checkIn=${stay.checkIn}&checkOut=${stay.checkOut}&guests=2`,
  );
  await page.getByRole('button', { name: 'Use essential only' }).click();
  await expect(
    page.getByRole('heading', { name: 'The Battery' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('customer-journey exposes substantive policy pages and cookie reopening', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/information/privacy');
  await page.getByRole('button', { name: 'Use essential only' }).click();
  await expect(
    page.getByRole('heading', { name: 'Privacy notice' }),
  ).toBeVisible();
  await expect(
    page.getByText(/never stores a readable password/i),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cookie preferences' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your privacy choices' }),
  ).toBeVisible();
});
