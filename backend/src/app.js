import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import { HttpError, sendError } from './http/errors.js';
import { createAuthModule } from './modules/auth/routes.js';
import { createCatalogRouter } from './modules/catalog/routes.js';
import { createReservationRouter } from './modules/reservations/routes.js';
import { createWeatherRouter } from './modules/weather/routes.js';

export function createApp({
  logError = console.error,
  database,
  authentication,
  catalog,
  catalogNow,
  configureRoutes,
  reservationNow,
  weather,
  trustProxyHops = 0,
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (trustProxyHops > 0) app.set('trust proxy', trustProxyHops);
  app.use(helmet());
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set('X-Request-Id', req.requestId);
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  if (database) {
    app.get('/api/ready', async (_req, res) => {
      try {
        await database.query('SELECT 1');
        res.json({ status: 'ready' });
      } catch {
        res.status(503).json({ status: 'unavailable' });
      }
    });
  }
  const auth = authentication ? createAuthModule(authentication) : null;
  if (auth) {
    app.locals.authenticate = auth.authenticate;
    app.use('/api', auth.protectMutation);
    app.use('/api/auth', auth.router);
  }
  if (database && auth) {
    app.use(
      '/api',
      createCatalogRouter({
        database,
        authenticate: auth.authenticate,
        authorizeAdmin: auth.authorizeAdmin,
        now: catalogNow,
        imageHostAllowlist: catalog?.imageHostAllowlist,
      }),
    );
    app.use(
      '/api',
      createReservationRouter({
        database,
        authenticate: auth.authenticate,
        authorizeAdmin: auth.authorizeAdmin,
        now: reservationNow,
      }),
    );
  }
  if (weather) app.use('/api', createWeatherRouter(weather));
  configureRoutes?.(app, auth);
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found.',
        details: {},
        requestId: req.requestId,
      },
    });
  });
  // Express recognizes error middleware by its four-argument signature.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof HttpError) return sendError(res, req.requestId, error);
    const malformed = error.type === 'entity.parse.failed';
    const tooLarge = error.type === 'entity.too.large';
    const status = malformed ? 400 : tooLarge ? 413 : 500;
    if (status === 500)
      logError({ event: 'request_failed', requestId: req.requestId });
    return sendError(
      res,
      req.requestId,
      new HttpError(
        status,
        malformed
          ? 'INVALID_JSON'
          : tooLarge
            ? 'PAYLOAD_TOO_LARGE'
            : 'INTERNAL_ERROR',
        malformed
          ? 'Request body must be valid JSON.'
          : tooLarge
            ? 'Request body is too large.'
            : 'An unexpected error occurred.',
      ),
    );
  });
  return app;
}
