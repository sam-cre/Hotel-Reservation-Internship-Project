import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import {
  authApi,
  catalogApi,
  reservationApi,
  weatherApi,
} from '../src/services/api.js';

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

const hotel = {
  id: '11',
  name: 'The Battery',
  city: 'Charleston',
  address: '18 East Bay Street, Charleston, SC',
  description: 'A full-service waterfront hotel with broad harbor views.',
  rating: '4.9',
  imageUrl: '/images/battery-terrace.jpg',
  amenities: ['Rooftop terrace', 'Harbor dining'],
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

const reservation = {
  id: '31',
  checkIn: '2026-10-10',
  checkOut: '2026-10-13',
  guests: 2,
  pricePerNight: '465.00',
  totalPrice: '1395.00',
  status: 'confirmed',
  hotel: { id: '11', name: 'The Battery', city: 'Charleston' },
  room: { id: '21', name: 'Harbor View King' },
};

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.setItem('stillwater-cookie-choice', 'essential');
  authApi.current.mockResolvedValue(null);
  authApi.login.mockResolvedValue({
    id: '1',
    name: 'Sam Guest',
    email: 'sam@example.com',
    role: 'customer',
  });
  authApi.register.mockResolvedValue({
    id: '1',
    name: 'Sam Guest',
    email: 'sam@example.com',
    role: 'customer',
  });
  authApi.logout.mockResolvedValue();
  catalogApi.hotels.mockResolvedValue([hotel]);
  catalogApi.hotel.mockResolvedValue(hotel);
  catalogApi.rooms.mockResolvedValue([room]);
  weatherApi.current.mockResolvedValue({
    location: 'Charleston, South Carolina, United States',
    observedAt: '2026-09-16T11:15',
    temperature: 78.4,
    apparentTemperature: 80.1,
    weatherCode: 2,
    windSpeed: 8.7,
    units: { temperature: '°F', windSpeed: 'mp/h' },
  });
  reservationApi.create.mockResolvedValue(reservation);
  reservationApi.one.mockResolvedValue(reservation);
  reservationApi.mine.mockResolvedValue([reservation]);
});

describe('customer application', () => {
  it('loads live search results and preserves stay criteria in the hotel link', async () => {
    renderApp(
      '/search?city=Charleston&checkIn=2026-10-10&checkOut=2026-10-13&guests=2',
    );

    expect(
      await screen.findByRole('heading', { name: 'The Battery' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Rooftop terrace')).toBeInTheDocument();
    const roomLink = screen.getByRole('link', { name: /view rooms/i });
    expect(roomLink).toHaveAttribute(
      'href',
      '/hotels/11?city=Charleston&checkIn=2026-10-10&checkOut=2026-10-13&guests=2',
    );
    expect(catalogApi.hotels).toHaveBeenCalledWith(
      {
        city: 'Charleston',
        checkIn: '2026-10-10',
        checkOut: '2026-10-13',
        guests: '2',
      },
      expect.any(AbortSignal),
    );
  });

  it('shows only API-provided room totals and carries the stay into review', async () => {
    const user = userEvent.setup();
    renderApp(
      '/hotels/11?city=Charleston&checkIn=2026-10-10&checkOut=2026-10-13&guests=2',
    );

    expect(
      await screen.findByRole('heading', { name: 'Harbor View King' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$1,395/)).toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: 'Weather in Charleston' }),
    ).toHaveTextContent('78°F');
    await user.click(screen.getByRole('link', { name: 'Review this room' }));
    expect(
      await screen.findByRole('heading', { name: 'Welcome back.' }),
    ).toBeInTheDocument();
  });

  it('keeps hotel and room details usable when weather is unavailable', async () => {
    weatherApi.current.mockRejectedValue(new Error('provider unavailable'));
    renderApp(
      '/hotels/11?city=Charleston&checkIn=2026-10-10&checkOut=2026-10-13&guests=2',
    );

    expect(
      await screen.findByRole('heading', { name: 'Harbor View King' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Current weather is temporarily unavailable.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Review this room' }),
    ).toBeInTheDocument();
  });

  it('registers, returns to review, and submits no client-controlled price', async () => {
    const user = userEvent.setup();
    renderApp(
      '/register?returnTo=%2Freserve%3Fcity%3DCharleston%26checkIn%3D2026-10-10%26checkOut%3D2026-10-13%26guests%3D2%26hotelId%3D11%26roomId%3D21',
    );

    await user.type(screen.getByLabelText('Full name'), 'Sam Guest');
    await user.type(screen.getByLabelText('Email address'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'long-password-123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByRole('heading', { name: 'Review your stay.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('$1,395')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Confirm reservation' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Your room is waiting.' }),
    ).toBeInTheDocument();
    expect(reservationApi.create).toHaveBeenCalledWith(
      {
        roomId: '21',
        checkIn: '2026-10-10',
        checkOut: '2026-10-13',
        guests: 2,
      },
      expect.any(String),
    );
  });

  it('provides substantive privacy content and reopenable cookie controls', async () => {
    const user = userEvent.setup();
    renderApp('/information/privacy');

    expect(
      screen.getByRole('heading', { name: 'Privacy notice' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/never stores a readable password/i),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Cookie preferences' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Your privacy choices' }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Use essential only' }),
    );
    expect(window.localStorage.getItem('stillwater-cookie-choice')).toBe(
      'essential',
    );
  });

  it('renders loading, empty, and error states for reservation history', async () => {
    authApi.current.mockResolvedValue({ id: '1', role: 'customer' });
    reservationApi.mine.mockResolvedValue([]);
    renderApp('/reservations');
    expect(
      await screen.findByRole('heading', {
        name: 'Your first stay starts here.',
      }),
    ).toBeInTheDocument();

    await waitFor(() => expect(reservationApi.mine).toHaveBeenCalled());
  });
});
