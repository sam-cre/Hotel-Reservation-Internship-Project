import { z } from 'zod';

const schema = z.object({
  WEATHER_TIMEOUT_MS: z.coerce.number().int().min(250).max(15000).default(4000),
  WEATHER_CACHE_TTL_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(3600000)
    .default(600000),
  WEATHER_MAX_IN_FLIGHT: z.coerce.number().int().min(1).max(64).default(4),
  WEATHER_MAX_CACHE_ENTRIES: z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .default(500),
  WEATHER_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(3600000)
    .default(60000),
  WEATHER_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10000).default(60),
  WEATHER_GEOCODING_URL: z
    .string()
    .url()
    .default('https://geocoding-api.open-meteo.com/v1/search'),
  WEATHER_FORECAST_URL: z
    .string()
    .url()
    .default('https://api.open-meteo.com/v1/forecast'),
});

export function readWeatherEnvironment(source = process.env) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join('.'))),
    ];
    throw new Error(`Invalid weather configuration: ${fields.join(', ')}`);
  }
  return {
    timeoutMs: result.data.WEATHER_TIMEOUT_MS,
    cacheTtlMs: result.data.WEATHER_CACHE_TTL_MS,
    maxInFlight: result.data.WEATHER_MAX_IN_FLIGHT,
    maxCacheEntries: result.data.WEATHER_MAX_CACHE_ENTRIES,
    rateLimitWindowMs: result.data.WEATHER_RATE_LIMIT_WINDOW_MS,
    rateLimitMax: result.data.WEATHER_RATE_LIMIT_MAX,
    geocodingUrl: result.data.WEATHER_GEOCODING_URL,
    forecastUrl: result.data.WEATHER_FORECAST_URL,
  };
}
