import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { readWeatherEnvironment } from '../../src/config/weather.js';

const location = {
  results: [
    {
      name: 'Charleston',
      admin1: 'South Carolina',
      country: 'United States',
      latitude: 32.78,
      longitude: -79.93,
    },
  ],
};

const forecast = {
  current: {
    time: '2026-09-16T11:15',
    temperature_2m: 78.4,
    apparent_temperature: 80.1,
    weather_code: 2,
    wind_speed_10m: 8.7,
  },
  current_units: {
    temperature_2m: '°F',
    apparent_temperature: '°F',
    wind_speed_10m: 'mp/h',
  },
};

function json(body, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  };
}

function testContext(overrides = {}) {
  const fetcher = overrides.fetcher ?? vi.fn();
  const app = createApp({
    logError: () => {},
    weather: {
      fetcher,
      now: overrides.now,
      config: {
        timeoutMs: overrides.timeoutMs ?? 100,
        cacheTtlMs: overrides.cacheTtlMs ?? 1000,
        geocodingUrl: 'https://geocoding.example/search',
        forecastUrl: 'https://forecast.example/forecast',
      },
    },
  });
  return { fetcher, request: request(app) };
}

describe('weather API', () => {
  it('applies safe defaults and rejects unsafe timing configuration', () => {
    expect(readWeatherEnvironment({})).toEqual({
      timeoutMs: 4000,
      cacheTtlMs: 600000,
      geocodingUrl: 'https://geocoding-api.open-meteo.com/v1/search',
      forecastUrl: 'https://api.open-meteo.com/v1/forecast',
    });
    expect(() =>
      readWeatherEnvironment({ WEATHER_TIMEOUT_MS: '20000' }),
    ).toThrow('Invalid weather configuration: WEATHER_TIMEOUT_MS');
  });

  it('returns a stable internal response from the upstream services', async () => {
    const context = testContext();
    context.fetcher
      .mockResolvedValueOnce(json(location))
      .mockResolvedValueOnce(json(forecast));

    const response = await context.request
      .get('/api/weather')
      .query({ city: 'Charleston' })
      .expect(200);

    expect(response.body).toEqual({
      weather: {
        location: 'Charleston, South Carolina, United States',
        observedAt: '2026-09-16T11:15',
        temperature: 78.4,
        apparentTemperature: 80.1,
        weatherCode: 2,
        windSpeed: 8.7,
        units: { temperature: '°F', windSpeed: 'mp/h' },
      },
    });
    const geocodingUrl = new URL(context.fetcher.mock.calls[0][0]);
    expect(geocodingUrl.searchParams.get('name')).toBe('Charleston');
    expect(geocodingUrl.searchParams.get('count')).toBe('1');
    const forecastUrl = new URL(context.fetcher.mock.calls[1][0]);
    expect(forecastUrl.searchParams.get('temperature_unit')).toBe('fahrenheit');
    expect(forecastUrl.searchParams.get('timezone')).toBe('auto');
  });

  it('uses a normalized, expiring cache for successful lookups', async () => {
    let clock = 1000;
    const context = testContext({ now: () => clock, cacheTtlMs: 100 });
    context.fetcher.mockResolvedValueOnce(json(location));
    context.fetcher.mockResolvedValueOnce(json(forecast));

    await context.request.get('/api/weather').query({ city: 'Charleston' });
    await context.request.get('/api/weather').query({ city: ' charleston ' });
    expect(context.fetcher).toHaveBeenCalledTimes(2);

    clock = 1101;
    context.fetcher
      .mockResolvedValueOnce(json(location))
      .mockResolvedValueOnce(json(forecast));
    await context.request.get('/api/weather').query({ city: 'Charleston' });
    expect(context.fetcher).toHaveBeenCalledTimes(4);
  });

  it('coalesces concurrent requests for the same city', async () => {
    let resolveGeocoding;
    const geocodingPending = new Promise((resolve) => {
      resolveGeocoding = resolve;
    });
    const context = testContext();
    context.fetcher
      .mockReturnValueOnce(geocodingPending)
      .mockResolvedValueOnce(json(forecast));

    const first = context.request
      .get('/api/weather')
      .query({ city: 'Atlanta' });
    const second = context.request
      .get('/api/weather')
      .query({ city: 'atlanta' });
    resolveGeocoding(json(location));
    await Promise.all([first.expect(200), second.expect(200)]);

    expect(context.fetcher).toHaveBeenCalledTimes(2);
  });

  it('reports an unknown city without requesting a forecast', async () => {
    const context = testContext();
    context.fetcher.mockResolvedValueOnce(json({ results: [] }));
    const response = await context.request
      .get('/api/weather')
      .query({ city: 'Not a real place' })
      .expect(404);

    expect(response.body.error.code).toBe('WEATHER_LOCATION_NOT_FOUND');
    expect(context.fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an upstream rejection', vi.fn().mockRejectedValue(new Error('secret'))],
    [
      'a malformed response',
      vi.fn().mockResolvedValue(json({ results: 'invalid' })),
    ],
  ])('sanitizes %s', async (_label, fetcher) => {
    const context = testContext({ fetcher });
    const response = await context.request
      .get('/api/weather')
      .query({ city: 'Charleston' })
      .expect(503);

    expect(response.body.error.message).not.toContain('secret');
    expect(response.body.error.requestId).toBeTruthy();
  });

  it('bounds slow upstream requests', async () => {
    const fetcher = vi.fn((_url, { signal }) => {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });
    const context = testContext({ fetcher, timeoutMs: 10 });
    const response = await context.request
      .get('/api/weather')
      .query({ city: 'Charleston' })
      .expect(503);

    expect(response.body.error.code).toBe('WEATHER_UPSTREAM_TIMEOUT');
  });

  it('validates the city query before calling the provider', async () => {
    const context = testContext();
    const response = await context.request.get('/api/weather').expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.fields).toContain('city');
    expect(context.fetcher).not.toHaveBeenCalled();
  });
});
