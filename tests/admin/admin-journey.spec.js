import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const administrator = {
  id: '1',
  name: 'Stillwater Operator',
  email: 'operations@stillwater.test',
  role: 'admin',
};

function createState() {
  return {
    hotelSequence: 12,
    roomSequence: 22,
    hotels: [
      {
        id: '11',
        name: 'The Battery',
        city: 'Charleston',
        address: '18 East Bay Street, Charleston, SC',
        description: 'A full-service waterfront hotel with harbor views.',
        rating: '4.9',
        imageUrl: '/images/battery-terrace.jpg',
        startingPrice: '465.00',
      },
    ],
    rooms: [
      {
        id: '21',
        hotelId: '11',
        name: 'Harbor View King',
        description: 'One king bed with a harbor-facing sitting area.',
        pricePerNight: '465.00',
        capacity: 2,
        totalRooms: 8,
      },
    ],
    reservations: [
      {
        id: '31',
        checkIn: '2026-10-10',
        checkOut: '2026-10-13',
        guests: 2,
        pricePerNight: '465.00',
        totalPrice: '1395.00',
        status: 'confirmed',
        customer: {
          id: '7',
          name: 'Sam Guest',
          email: 'sam@example.com',
        },
        hotel: { id: '11', name: 'The Battery', city: 'Charleston' },
        room: { id: '21', name: 'Harbor View King' },
      },
    ],
  };
}

async function mockAdminApi(page, { user = administrator } = {}) {
  const state = createState();
  let adminCalls = 0;
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path === '/api/auth/me') return json({ user });
    if (path === '/api/auth/logout') return route.fulfill({ status: 204 });

    if (path === '/api/admin/reservations' && method === 'GET') {
      adminCalls += 1;
      const status = url.searchParams.get('status');
      return json({
        reservations: status
          ? state.reservations.filter((item) => item.status === status)
          : state.reservations,
      });
    }
    if (path === '/api/admin/reservations/31/status' && method === 'PUT') {
      adminCalls += 1;
      state.reservations[0] = {
        ...state.reservations[0],
        status: 'cancelled',
      };
      return json({ reservation: state.reservations[0] });
    }
    if (path === '/api/hotels' && method === 'GET') {
      adminCalls += 1;
      return json({ hotels: state.hotels });
    }
    if (path === '/api/hotels' && method === 'POST') {
      adminCalls += 1;
      const input = request.postDataJSON();
      const hotel = {
        ...input,
        id: String(state.hotelSequence++),
        rating: Number(input.rating).toFixed(1),
        startingPrice: null,
      };
      state.hotels.push(hotel);
      return json({ hotel }, 201);
    }
    const hotelMatch = path.match(/^\/api\/hotels\/(\d+)$/);
    if (hotelMatch && method === 'PUT') {
      adminCalls += 1;
      const input = request.postDataJSON();
      const index = state.hotels.findIndex((item) => item.id === hotelMatch[1]);
      state.hotels[index] = {
        ...state.hotels[index],
        ...input,
        rating: Number(input.rating).toFixed(1),
      };
      return json({ hotel: state.hotels[index] });
    }
    if (hotelMatch && method === 'DELETE') {
      adminCalls += 1;
      state.hotels = state.hotels.filter((item) => item.id !== hotelMatch[1]);
      return route.fulfill({ status: 204 });
    }
    const roomListMatch = path.match(/^\/api\/hotels\/(\d+)\/rooms$/);
    if (roomListMatch && method === 'GET') {
      adminCalls += 1;
      return json({
        rooms: state.rooms.filter((item) => item.hotelId === roomListMatch[1]),
      });
    }
    if (roomListMatch && method === 'POST') {
      adminCalls += 1;
      const input = request.postDataJSON();
      const room = {
        ...input,
        id: String(state.roomSequence++),
        hotelId: roomListMatch[1],
        pricePerNight: Number(input.pricePerNight).toFixed(2),
      };
      state.rooms.push(room);
      return json({ room }, 201);
    }
    const roomMatch = path.match(/^\/api\/rooms\/(\d+)$/);
    if (roomMatch && method === 'PUT') {
      adminCalls += 1;
      const input = request.postDataJSON();
      const index = state.rooms.findIndex((item) => item.id === roomMatch[1]);
      state.rooms[index] = {
        ...state.rooms[index],
        ...input,
        pricePerNight: Number(input.pricePerNight).toFixed(2),
      };
      return json({ room: state.rooms[index] });
    }
    if (roomMatch && method === 'DELETE') {
      adminCalls += 1;
      state.rooms = state.rooms.filter((item) => item.id !== roomMatch[1]);
      return route.fulfill({ status: 204 });
    }
    return json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }, 404);
  });
  return { state, getAdminCalls: () => adminCalls };
}

test('admin-journey manages reservations, hotels, and room inventory', async ({
  page,
}) => {
  await mockAdminApi(page);
  await page.goto('/admin/reservations');

  await expect(
    page.getByRole('heading', { name: 'Reservations' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'View reservation 31' }).click();
  await page.getByRole('button', { name: 'Cancel reservation' }).click();
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Hotels and rooms' }).click();
  await page.getByRole('button', { name: 'Add hotel' }).click();
  await page.getByLabel('Hotel name').fill('The Wentworth');
  await page.getByLabel('City').fill('Charleston');
  await page.getByLabel('Street address').fill('44 Wentworth Street');
  await page
    .getByLabel('Description')
    .fill('A city hotel with a central garden court.');
  await page.getByLabel('Rating').fill('4.6');
  await page.getByLabel('Image URL').fill('/images/calhoun-lobby.jpg');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add hotel' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'The Wentworth' }),
  ).toBeVisible();

  const battery = page.locator('article').filter({ hasText: 'The Battery' });
  await battery.getByRole('button', { name: 'Manage rooms' }).click();
  await page.getByRole('button', { name: 'Add room type' }).click();
  await page.getByLabel('Room name').fill('Garden Double');
  await page
    .getByLabel('Description')
    .fill('Two queen beds overlooking the garden court.');
  await page.getByLabel('Nightly price').fill('425');
  await page.getByLabel('Guest capacity').fill('4');
  await page.getByLabel('Total rooms').fill('6');
  await page.getByRole('button', { name: 'Save room type' }).click();
  await expect(page.getByText('Garden Double')).toBeVisible();
  await page.getByRole('button', { name: 'Edit Garden Double' }).click();
  await page.getByLabel('Nightly price').fill('435');
  await page.getByRole('button', { name: 'Save room type' }).click();
  await expect(
    page.getByText('$435 per night, 4 guests, 6 rooms'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Deactivate Garden Double' }).click();
  await page.getByRole('button', { name: 'Deactivate', exact: true }).click();
  await expect(page.getByText('Garden Double')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close dialog' }).click();

  await page.getByRole('button', { name: 'Edit The Battery' }).click();
  await page.getByLabel('Street address').fill('20 East Bay Street');
  await page.getByRole('button', { name: 'Save hotel' }).click();
  await expect(page.getByText('20 East Bay Street')).toBeVisible();

  await page.getByRole('button', { name: 'Deactivate The Wentworth' }).click();
  await page.getByRole('button', { name: 'Deactivate hotel' }).click();
  await expect(
    page.getByRole('heading', { name: 'The Wentworth' }),
  ).toHaveCount(0);
});

test('admin-journey stays accessible and contained at mobile width', async ({
  page,
}) => {
  await mockAdminApi(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/admin/reservations');
  await expect(page.getByText('Sam Guest')).toBeVisible();

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole('region', { name: 'Reservation records' }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('admin-journey blocks customer accounts before administrator API calls', async ({
  page,
}) => {
  const api = await mockAdminApi(page, {
    user: { id: '2', name: 'Guest Account', role: 'customer' },
  });
  await page.goto('/admin/reservations');
  await expect(
    page.getByRole('heading', { name: 'Administrator access required' }),
  ).toBeVisible();
  expect(api.getAdminCalls()).toBe(0);
});
