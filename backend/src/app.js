import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';

export function createApp({ logError = console.error } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set('X-Request-Id', req.requestId);
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
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
    const malformed = error.type === 'entity.parse.failed';
    const tooLarge = error.type === 'entity.too.large';
    const status = malformed ? 400 : tooLarge ? 413 : 500;
    if (status === 500)
      logError({ event: 'request_failed', requestId: req.requestId });
    res.status(status).json({
      error: {
        code: malformed
          ? 'INVALID_JSON'
          : tooLarge
            ? 'PAYLOAD_TOO_LARGE'
            : 'INTERNAL_ERROR',
        message: malformed
          ? 'Request body must be valid JSON.'
          : tooLarge
            ? 'Request body is too large.'
            : 'An unexpected error occurred.',
        details: {},
        requestId: req.requestId,
      },
    });
  });
  return app;
}
