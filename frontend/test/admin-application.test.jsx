import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import { adminApi, authApi, catalogApi } from '../src/services/api.js';

vi.mock('../src/services/api.js', () => ({
  apiMessage(error, fallback) {
    return error?.response?.data?.error?.message || fallback;
  },
  authApi: {
    current: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  catalogApi: {
    hotels: vi.fn(),
    hotel: vi.fn(),
    rooms: vi.fn(),
  },
  weatherApi: {
    current: vi.fn(),
  },
  reservationApi: {
    create: vi.fn(),
    mine: vi.fn(),
    one: vi.fn(),
  },
  adminApi: {
    reservations: vi.fn(),
    updateReservationStatus: vi.fn(),
    createHotel: vi.fn(),
    updateHotel: vi.fn(),
    deactivateHotel: vi.fn(),
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    deactivateRoom: vi.fn(),
  },
}));

const administrator = {
  id: '1',
  name: 'Stillwater Operator',
  email: 'operations@stillwater.test',
  role: 'admin',
};

const hotel = {
  id: '11',
  name: 'The Battery',
  city: 'Charleston',
  address: '18 East Bay Street, Charleston, SC',
  description: 'A full-service waterfront hotel with broad harbor views.',
  rating: '4.9',
  imageUrl: '/images/battery-terrace.jpg',
  amenities: ['Rooftop terrace', 'Valet parking'],
  startingPrice: '465.00',
};

const room = {
  id: '21',
  hotelId: '11',
  name: 'Harbor View King',
  description: 'One king bed with a harbor-facing sitting area.',
  pricePerNight: '465.00',
  capacity: 2,
  totalRooms: 8,
};

const reservation = {
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
};

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authApi.current.mockResolvedValue(administrator);
  authApi.logout.mockResolvedValue();
  catalogApi.hotels.mockResolvedValue([hotel]);
  catalogApi.rooms.mockResolvedValue([room]);
  adminApi.reservations.mockResolvedValue([reservation]);
  adminApi.updateReservationStatus.mockResolvedValue({
    ...reservation,
    status: 'cancelled',
  });
  adminApi.createHotel.mockResolvedValue(hotel);
  adminApi.updateHotel.mockResolvedValue(hotel);
  adminApi.deactivateHotel.mockResolvedValue();
  adminApi.createRoom.mockResolvedValue(room);
  adminApi.updateRoom.mockResolvedValue(room);
  adminApi.deactivateRoom.mockResolvedValue();
});

describe('administrator application', () => {
  it('does not render or call administrator functionality for customers', async () => {
    authApi.current.mockResolvedValue({
      id: '2',
      name: 'Customer Account',
      role: 'customer',
    });
    renderApp('/admin/reservations');

    expect(
      await screen.findByRole('heading', {
        name: 'Administrator access required',
      }),
    ).toBeInTheDocument();
    expect(adminApi.reservations).not.toHaveBeenCalled();
    expect(catalogApi.hotels).not.toHaveBeenCalled();
  });

  it('filters the reservation register and confirms cancellation', async () => {
    const user = userEvent.setup();
    renderApp('/admin/reservations');

    expect(
      await screen.findByRole('heading', { name: 'Reservations' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Sam Guest')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'View reservation 31' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Cancel reservation' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Confirm cancellation' }),
    );

    expect(adminApi.updateReservationStatus).toHaveBeenCalledWith(
      '31',
      'cancelled',
    );
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
  });

  it('keeps reservation conflicts visible inside the active dialog', async () => {
    const user = userEvent.setup();
    adminApi.updateReservationStatus.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'The reservation status cannot be changed again.',
          },
        },
      },
    });
    renderApp('/admin/reservations');

    await user.click(
      await screen.findByRole('button', { name: 'View reservation 31' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Cancel reservation' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Confirm cancellation' }),
    );

    expect(
      within(screen.getByRole('dialog')).getByText(
        'The reservation status cannot be changed again.',
      ),
    ).toBeInTheDocument();
  });

  it('adds a hotel with typed numeric data and prevents repeat submission', async () => {
    const user = userEvent.setup();
    let resolveCreate;
    adminApi.createHotel.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    renderApp('/admin/hotels');

    await screen.findByRole('heading', { name: 'Hotels and rooms' });
    await user.click(screen.getByRole('button', { name: 'Add hotel' }));
    await user.type(screen.getByLabelText('Hotel name'), 'The Wentworth');
    await user.type(screen.getByLabelText('City'), 'Charleston');
    await user.type(
      screen.getByLabelText('Street address'),
      '44 Wentworth Street',
    );
    await user.type(
      screen.getByLabelText('Description'),
      'A city hotel with a central garden court.',
    );
    await user.clear(screen.getByLabelText('Rating'));
    await user.type(screen.getByLabelText('Rating'), '4.6');
    await user.type(
      screen.getByLabelText('Image URL'),
      '/images/calhoun-lobby.jpg',
    );
    await user.type(
      screen.getByLabelText('Amenities'),
      'Rooftop terrace, Valet parking, Rooftop terrace',
    );
    const dialog = screen.getByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: 'Add hotel' });
    await user.click(submit);

    expect(submit).toBeDisabled();
    expect(adminApi.createHotel).toHaveBeenCalledTimes(1);
    expect(adminApi.createHotel).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 4.6,
        amenities: ['Rooftop terrace', 'Valet parking'],
      }),
    );
    resolveCreate({ ...hotel, id: '12', name: 'The Wentworth' });
    expect(
      await screen.findByRole('heading', { name: 'The Wentworth' }),
    ).toBeInTheDocument();
  });

  it('preserves room entries when the server rejects an inventory edit', async () => {
    const user = userEvent.setup();
    adminApi.updateRoom.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Inventory cannot be reduced below confirmed stays.',
          },
        },
      },
    });
    renderApp('/admin/hotels');

    await user.click(
      await screen.findByRole('button', { name: 'Manage rooms' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Edit Harbor View King' }),
    );
    const inventory = screen.getByLabelText('Total rooms');
    await user.clear(inventory);
    await user.type(inventory, '1');
    await user.click(screen.getByRole('button', { name: 'Save room type' }));

    expect(
      await screen.findByText(
        'Inventory cannot be reduced below confirmed stays.',
      ),
    ).toBeInTheDocument();
    expect(inventory).toHaveValue(1);
  });
});
