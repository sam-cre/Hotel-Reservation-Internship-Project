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

// Runs at most `max` tasks concurrently. Distinct city keys are queued rather
// than all contacting the provider at once, which bounds sockets, memory, and
// provider quota under an unauthenticated request burst.
function createConcurrencyLimiter(max) {
  let active = 0;
  const waiting = [];
  const runNext = () => {
    if (active >= max || waiting.length === 0) return;
    active += 1;
    const { task, resolve, reject } = waiting.shift();
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        active -= 1;
        runNext();
      });
  };
  return (task) =>
    new Promise((resolve, reject) => {
      waiting.push({ task, resolve, reject });
      runNext();
    });
}

export function createWeatherService({
  fetcher = fetch,
  config,
  now = () => Date.now(),
}) {
  const maxInFlight = config.maxInFlight ?? 4;
  const maxCacheEntries = config.maxCacheEntries ?? 500;
  const limit = createConcurrencyLimiter(maxInFlight);
  const cache = new Map();
  const pending = new Map();

  function readCache(key) {
    const cached = cache.get(key);
    if (!cached) return undefined;
    if (cached.expiresAt <= now()) {
      cache.delete(key);
      return undefined;
    }
    return cached.value;
  }

  function writeCache(key, value) {
    // Drop expired entries and hold the map to its configured size using
    // first-in eviction so a stream of distinct cities cannot grow it without
    // bound. Map preserves insertion order, so the first key is the oldest.
    for (const [existingKey, entry] of cache) {
      if (entry.expiresAt <= now()) cache.delete(existingKey);
    }
    cache.delete(key);
    cache.set(key, { value, expiresAt: now() + config.cacheTtlMs });
    while (cache.size > maxCacheEntries) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }
  }

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
      const cached = readCache(key);
      if (cached !== undefined) return cached;
      if (pending.has(key)) return pending.get(key);

      // Register the shared work before entering the concurrency queue so
      // concurrent requests for the same city still coalesce onto one call
      // while distinct keys wait for an available slot.
      const work = limit(() => load(city))
        .then((value) => {
          writeCache(key, value);
          return value;
        })
        .finally(() => pending.delete(key));
      pending.set(key, work);
      return work;
    },
  };
}
