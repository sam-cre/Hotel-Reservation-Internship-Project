import { Router } from 'express';
import { asyncHandler } from '../../http/errors.js';
import { parseRequest } from '../../http/validation.js';
import { createExpiredSessionCookie, createSessionCookie } from './cookies.js';
import { createAuthenticationMiddleware, requireRole } from './middleware.js';
import { createAuthRateLimits } from './rate-limits.js';
import { createAuthRepository } from './repository.js';
import { requireSafeBrowserMutation } from './request-safety.js';
import { createAuthService } from './service.js';
import { createTokenService } from './tokens.js';
import { loginSchema, registrationSchema } from './validation.js';

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
        parseRequest(registrationSchema, req.body),
      );
      res.set('Set-Cookie', createSessionCookie(result.token, config));
      res.status(201).json({ user: result.user });
    }),
  );
  router.post(
    '/login',
    limits.loginByIp,
    limits.loginByIdentity,
    limits.loginByAccount,
    asyncHandler(async (req, res) => {
      const result = await service.login(parseRequest(loginSchema, req.body));
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
