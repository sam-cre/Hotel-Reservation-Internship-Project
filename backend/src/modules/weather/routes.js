import { Router } from 'express';
import { asyncHandler } from '../../http/errors.js';
import { parseRequest } from '../../http/validation.js';
import { createWeatherService } from './service.js';
import { weatherQuerySchema } from './validation.js';

export function createWeatherRouter(options) {
  const service = createWeatherService(options);
  const router = Router();

  router.get(
    '/weather',
    asyncHandler(async (req, res) => {
      const { city } = parseRequest(weatherQuerySchema, req.query);
      res.json({ weather: await service.current(city) });
    }),
  );

  return router;
}
