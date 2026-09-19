import { describe, expect, it } from 'vitest';
import { shouldClearSession } from '../src/services/api.js';

describe('shouldClearSession', () => {
  it('clears the session on a 401 from an authenticated endpoint', () => {
    expect(
      shouldClearSession({
        response: { status: 401 },
        config: { url: '/reservations/my' },
      }),
    ).toBe(true);
  });

  it('does not clear on auth-endpoint 401s (bad login or initial /me)', () => {
    expect(
      shouldClearSession({
        response: { status: 401 },
        config: { url: '/auth/login' },
      }),
    ).toBe(false);
    expect(
      shouldClearSession({
        response: { status: 401 },
        config: { url: '/auth/me' },
      }),
    ).toBe(false);
  });

  it('ignores non-401 errors and errors without a response', () => {
    expect(
      shouldClearSession({
        response: { status: 500 },
        config: { url: '/reservations/my' },
      }),
    ).toBe(false);
    expect(shouldClearSession({ config: { url: '/hotels' } })).toBe(false);
    expect(shouldClearSession({})).toBe(false);
  });
});
