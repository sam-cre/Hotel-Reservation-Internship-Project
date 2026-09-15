import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 90000,
  withCredentials: true,
  headers: { 'X-CSRF-Protection': '1' },
});
