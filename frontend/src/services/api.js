import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 90000,
  withCredentials: true,
  headers: { 'X-CSRF-Protection': '1' },
});

export function apiMessage(
  error,
  fallback = 'Something went wrong. Try again.',
) {
  return error?.response?.data?.error?.message || fallback;
}

// A 401 from an authenticated call means the session ended server-side (for
// example the cookie expired). The auth endpoints handle their own 401s: a bad
// login must not look like a dropped session, and /auth/me already drives the
// initial state. Anything else clears the cached user so the app stops treating
// the viewer as signed in and the sign-in page no longer bounces them back.
export function shouldClearSession(error) {
  const status = error?.response?.status;
  const url = error?.config?.url ?? '';
  return status === 401 && !url.startsWith('/auth/');
}

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldClearSession(error) && unauthorizedHandler) unauthorizedHandler();
    return Promise.reject(error);
  },
);

export const authApi = {
  async current(signal) {
    return (await api.get('/auth/me', { signal })).data.user;
  },
  async login(input) {
    return (await api.post('/auth/login', input)).data.user;
  },
  async register(input) {
    return (await api.post('/auth/register', input)).data.user;
  },
  async logout() {
    await api.post('/auth/logout');
  },
};

export const catalogApi = {
  async hotels(criteria = {}, signal) {
    return (await api.get('/hotels', { params: criteria, signal })).data.hotels;
  },
  async hotel(id, signal) {
    return (await api.get(`/hotels/${id}`, { signal })).data.hotel;
  },
  async rooms(hotelId, criteria, signal) {
    return (
      await api.get(`/hotels/${hotelId}/rooms`, {
        params: criteria,
        signal,
      })
    ).data.rooms;
  },
};

export const weatherApi = {
  async current(city, signal) {
    return (await api.get('/weather', { params: { city }, signal })).data
      .weather;
  },
};

export const reservationApi = {
  async create(input, idempotencyKey) {
    return (
      await api.post('/reservations', input, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data.reservation;
  },
  async mine(signal) {
    return (await api.get('/reservations/my', { signal })).data.reservations;
  },
  async one(id, signal) {
    return (await api.get(`/reservations/${id}`, { signal })).data.reservation;
  },
};

export const adminApi = {
  async reservations(status, signal) {
    return (
      await api.get('/admin/reservations', {
        params: status && status !== 'all' ? { status } : undefined,
        signal,
      })
    ).data.reservations;
  },
  async updateReservationStatus(id, status) {
    return (await api.put(`/admin/reservations/${id}/status`, { status })).data
      .reservation;
  },
  async hotels(signal) {
    return (await api.get('/admin/hotels', { signal })).data.hotels;
  },
  async uploadImage(payload) {
    return (await api.post('/admin/images', payload)).data.url;
  },
  async createHotel(input) {
    return (await api.post('/hotels', input)).data.hotel;
  },
  async updateHotel(id, input) {
    return (await api.put(`/hotels/${id}`, input)).data.hotel;
  },
  async deactivateHotel(id) {
    await api.delete(`/hotels/${id}`);
  },
  async createRoom(hotelId, input) {
    return (await api.post(`/hotels/${hotelId}/rooms`, input)).data.room;
  },
  async updateRoom(id, input) {
    return (await api.put(`/rooms/${id}`, input)).data.room;
  },
  async deactivateRoom(id) {
    await api.delete(`/rooms/${id}`);
  },
};
