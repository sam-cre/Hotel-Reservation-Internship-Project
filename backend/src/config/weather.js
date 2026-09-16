import { z } from 'zod';

const schema = z.object({
  WEATHER_TIMEOUT_MS: z.coerce.number().int().min(250).max(15000).default(4000),
  WEATHER_CACHE_TTL_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(3600000)
    .default(600000),
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
    geocodingUrl: result.data.WEATHER_GEOCODING_URL,
    forecastUrl: result.data.WEATHER_FORECAST_URL,
  };
}
