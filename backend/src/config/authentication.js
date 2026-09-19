import { z } from 'zod';

const cookieNamePattern = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

const schema = z.object({
  JWT_SECRET: z.string().min(32).max(4096),
  JWT_ISSUER: z.string().trim().min(1).max(200).default('stillwater-api'),
  JWT_AUDIENCE: z.string().trim().min(1).max(200).default('stillwater-web'),
  JWT_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(30),
  AUTH_COOKIE_NAME: z
    .string()
    .regex(cookieNamePattern)
    .default('stillwater_session'),
  ALLOWED_ORIGINS: z.string().min(1),
  AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(60)
    .default(15),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  // A per-account (email-keyed) ceiling that throttles password guessing
  // against one account even when the attacker rotates source IPs. Kept
  // generous and window-long so it soft-blocks abuse without letting an
  // attacker lock a legitimate user out by exhausting a tight limit.
  AUTH_ACCOUNT_RATE_LIMIT_WINDOW_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(1440)
    .default(60),
  AUTH_ACCOUNT_RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(50),
});

function parseOrigins(value) {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      const url = new URL(origin);
      if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol))
        throw new Error(
          'Invalid authentication configuration: ALLOWED_ORIGINS',
        );
      return origin;
    });
  if (origins.length === 0 || new Set(origins).size !== origins.length)
    throw new Error('Invalid authentication configuration: ALLOWED_ORIGINS');
  return new Set(origins);
}

export function readAuthenticationEnvironment(source = process.env) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join('.'))),
    ];
    throw new Error(
      `Invalid authentication configuration: ${fields.join(', ')}`,
    );
  }
  let allowedOrigins;
  try {
    allowedOrigins = parseOrigins(result.data.ALLOWED_ORIGINS);
    if (
      source.NODE_ENV === 'production' &&
      [...allowedOrigins].some((origin) => !origin.startsWith('https://'))
    )
      throw new Error('Production origins must use HTTPS.');
  } catch {
    throw new Error('Invalid authentication configuration: ALLOWED_ORIGINS');
  }
  return {
    secret: result.data.JWT_SECRET,
    issuer: result.data.JWT_ISSUER,
    audience: result.data.JWT_AUDIENCE,
    ttlSeconds: result.data.JWT_TTL_MINUTES * 60,
    cookieName: result.data.AUTH_COOKIE_NAME,
    secureCookie: source.NODE_ENV === 'production',
    allowedOrigins,
    rateLimitWindowMs: result.data.AUTH_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    rateLimitMax: result.data.AUTH_RATE_LIMIT_MAX_REQUESTS,
    accountRateLimitWindowMs:
      result.data.AUTH_ACCOUNT_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    accountRateLimitMax: result.data.AUTH_ACCOUNT_RATE_LIMIT_MAX_REQUESTS,
  };
}
