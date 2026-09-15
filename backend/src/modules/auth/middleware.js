import { HttpError } from '../../http/errors.js';
import { readCookie } from './cookies.js';

export function createAuthenticationMiddleware({
  config,
  repository,
  tokenService,
}) {
  return async function authenticate(req, _res, next) {
    const token = readCookie(req.get('Cookie'), config.cookieName);
    if (!token)
      return next(
        new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in is required.'),
      );
    let userId;
    try {
      userId = await tokenService.verify(token);
    } catch {
      return next(
        new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in is required.'),
      );
    }
    const user = await repository.findUserById(userId);
    if (!user)
      return next(
        new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in is required.'),
      );
    req.auth = { user };
    return next();
  };
}

export function requireRole(role) {
  return function authorizeRole(req, _res, next) {
    if (req.auth?.user.role !== role)
      return next(
        new HttpError(403, 'AUTHORIZATION_REQUIRED', 'Access is not allowed.'),
      );
    return next();
  };
}
