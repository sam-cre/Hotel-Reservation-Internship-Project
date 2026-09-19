import { createHash } from 'node:crypto';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { HttpError } from '../../http/errors.js';

function rejectLimitedRequest(_req, _res, next) {
  next(
    new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Try again later.'),
  );
}

function emailKey(req) {
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
  return createHash('sha256').update(email).digest('hex');
}

function common(config) {
  return {
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rejectLimitedRequest,
  };
}

export function createAuthRateLimits(config) {
  return {
    registration: rateLimit(common(config)),
    loginByIp: rateLimit(common(config)),
    loginByIdentity: rateLimit({
      ...common(config),
      keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${emailKey(req)}`,
    }),
    // Keyed on the target account alone (no IP), so distributed guessing
    // against one email is throttled regardless of source address. Uses its
    // own generous window and ceiling to avoid locking legitimate users out.
    loginByAccount: rateLimit({
      windowMs: config.accountRateLimitWindowMs,
      max: config.accountRateLimitMax,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: rejectLimitedRequest,
      keyGenerator: emailKey,
    }),
  };
}
