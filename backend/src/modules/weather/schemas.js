import { z } from 'zod';

export const geocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string().min(1),
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
        country: z.string().min(1),
        admin1: z.string().min(1).optional(),
      }),
    )
    .optional(),
});

export const forecastResponseSchema = z.object({
  current: z.object({
    time: z.string().min(1),
    temperature_2m: z.number().finite(),
    apparent_temperature: z.number().finite(),
    weather_code: z.number().int().min(0).max(99),
    wind_speed_10m: z.number().finite().min(0),
  }),
  current_units: z.object({
    temperature_2m: z.string().min(1),
    apparent_temperature: z.string().min(1),
    wind_speed_10m: z.string().min(1),
  }),
});
