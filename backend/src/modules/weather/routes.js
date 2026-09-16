import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler, HttpError } from '../../http/errors.js';
import { parseRequest } from '../../http/validation.js';
import { createWeatherService } from './service.js';
import { weatherQuerySchema } from './validation.js';

export function createWeatherRouter(options) {
  const service = createWeatherService(options);
  const router = Router();

  // The weather endpoint is public and does provider work, so cap requests per
  // client before any lookup begins. This runs ahead of the concurrency and
  // cache bounds inside the service as a first line of defense.
  const limiter = rateLimit({
    windowMs: options.config.rateLimitWindowMs ?? 60000,
    max: options.config.rateLimitMax ?? 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(
        new HttpError(
          429,
          'RATE_LIMITED',
          'Too many weather requests. Try again later.',
        ),
      ),
  });

  router.get(
    '/weather',
    limiter,
    asyncHandler(async (req, res) => {
      const { city } = parseRequest(weatherQuerySchema, req.query);
      res.json({ weather: await service.current(city) });
    }),
  );

  return router;
}
