import { HttpError } from '../../http/errors.js';
import { forecastResponseSchema, geocodingResponseSchema } from './schemas.js';

function upstreamError(code, message) {
  return new HttpError(503, code, message);
}

function buildUrl(base, parameters) {
  const url = new URL(base);
  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, String(value));
  }
  return url;
}

async function requestJson(fetcher, url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok)
      throw upstreamError(
        'WEATHER_UPSTREAM_UNAVAILABLE',
        'Current weather is temporarily unavailable.',
      );
    return await response.json();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error.name === 'AbortError')
      throw upstreamError(
        'WEATHER_UPSTREAM_TIMEOUT',
        'Current weather took too long to respond.',
      );
    throw upstreamError(
      'WEATHER_UPSTREAM_UNAVAILABLE',
      'Current weather is temporarily unavailable.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success)
    throw upstreamError(
      'WEATHER_UPSTREAM_INVALID',
      'Current weather is temporarily unavailable.',
    );
  return result.data;
}

function locationName(location) {
  return [location.name, location.admin1, location.country]
    .filter(Boolean)
    .join(', ');
}

export function createWeatherService({
  fetcher = fetch,
  config,
  now = () => Date.now(),
}) {
  const cache = new Map();
  const pending = new Map();

  async function load(city) {
    const geocodingUrl = buildUrl(config.geocodingUrl, {
      name: city,
      count: 1,
      language: 'en',
      format: 'json',
    });
    const geocoding = parse(
      geocodingResponseSchema,
      await requestJson(fetcher, geocodingUrl, config.timeoutMs),
    );
    const location = geocoding.results?.[0];
    if (!location)
      throw new HttpError(
        404,
        'WEATHER_LOCATION_NOT_FOUND',
        'Current weather is unavailable for this city.',
      );

    const forecastUrl = buildUrl(config.forecastUrl, {
      latitude: location.latitude,
      longitude: location.longitude,
      current:
        'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      timezone: 'auto',
      forecast_days: 1,
    });
    const forecast = parse(
      forecastResponseSchema,
      await requestJson(fetcher, forecastUrl, config.timeoutMs),
    );
    return {
      location: locationName(location),
      observedAt: forecast.current.time,
      temperature: forecast.current.temperature_2m,
      apparentTemperature: forecast.current.apparent_temperature,
      weatherCode: forecast.current.weather_code,
      windSpeed: forecast.current.wind_speed_10m,
      units: {
        temperature: forecast.current_units.temperature_2m,
        windSpeed: forecast.current_units.wind_speed_10m,
      },
    };
  }

  return {
    async current(city) {
      const key = city.trim().toLocaleLowerCase('en-US');
      const cached = cache.get(key);
      if (cached && cached.expiresAt > now()) return cached.value;
      if (pending.has(key)) return pending.get(key);

      const work = load(city)
        .then((value) => {
          cache.set(key, {
            value,
            expiresAt: now() + config.cacheTtlMs,
          });
          return value;
        })
        .finally(() => pending.delete(key));
      pending.set(key, work);
      return work;
    },
  };
}
