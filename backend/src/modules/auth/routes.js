import { Router } from 'express';
import { ZodError } from 'zod';
import { asyncHandler, HttpError } from '../../http/errors.js';
import { createExpiredSessionCookie, createSessionCookie } from './cookies.js';
import { createAuthenticationMiddleware, requireRole } from './middleware.js';
import { createAuthRateLimits } from './rate-limits.js';
import { createAuthRepository } from './repository.js';
import { requireSafeBrowserMutation } from './request-safety.js';
import { createAuthService } from './service.js';
import { createTokenService } from './tokens.js';
import { loginSchema, registrationSchema } from './validation.js';

function parse(schema, value) {
  try {
    return schema.parse(value);
  } catch (error) {
    if (!(error instanceof ZodError)) throw error;
    const fields = [
      ...new Set(
        error.issues
          .flatMap((issue) =>
            issue.code === 'unrecognized_keys' ? issue.keys : issue.path[0],
          )
          .filter((field) => typeof field === 'string'),
      ),
    ];
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request is invalid.', {
      fields,
    });
  }
}

export function createAuthModule({ database, config }) {
  const repository = createAuthRepository(database);
  const tokenService = createTokenService(config);
  const service = createAuthService({ repository, tokenService });
  const authenticate = createAuthenticationMiddleware({
    config,
    repository,
    tokenService,
  });
  const limits = createAuthRateLimits(config);
  const router = Router();

  router.post(
    '/register',
    limits.registration,
    asyncHandler(async (req, res) => {
      const result = await service.register(
        parse(registrationSchema, req.body),
      );
      res.set('Set-Cookie', createSessionCookie(result.token, config));
      res.status(201).json({ user: result.user });
    }),
  );
  router.post(
    '/login',
    limits.loginByIp,
    limits.loginByIdentity,
    asyncHandler(async (req, res) => {
      const result = await service.login(parse(loginSchema, req.body));
      res.set('Set-Cookie', createSessionCookie(result.token, config));
      res.json({ user: result.user });
    }),
  );
  router.post('/logout', (_req, res) => {
    res.set('Set-Cookie', createExpiredSessionCookie(config));
    res.status(204).end();
  });
  router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.auth.user });
  });

  return {
    router,
    authenticate,
    authorizeAdmin: requireRole('admin'),
    protectMutation: requireSafeBrowserMutation(config.allowedOrigins),
  };
}
