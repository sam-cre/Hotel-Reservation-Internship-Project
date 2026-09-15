import { HttpError } from '../../http/errors.js';
import {
  hashPassword,
  passwordHashNeedsUpgrade,
  verifyDummyPassword,
  verifyPassword,
} from './passwords.js';

function invalidCredentials() {
  return new HttpError(
    401,
    'INVALID_CREDENTIALS',
    'Email or password is incorrect.',
  );
}

export function createAuthService({ repository, tokenService }) {
  return {
    async register(input) {
      const passwordHash = await hashPassword(input.password);
      let user;
      try {
        user = await repository.createCustomer({
          name: input.name,
          email: input.email,
          passwordHash,
        });
      } catch (error) {
        if (error.code === '23505')
          throw new HttpError(
            409,
            'EMAIL_ALREADY_REGISTERED',
            'An account already uses this email address.',
          );
        throw error;
      }
      return { user, token: await tokenService.sign(user.id) };
    },

    async login(input) {
      const record = await repository.findAuthenticationRecordByEmail(
        input.email,
      );
      const valid = record
        ? await verifyPassword(record.passwordHash, input.password)
        : await verifyDummyPassword(input.password);
      if (!record || !valid) throw invalidCredentials();
      if (passwordHashNeedsUpgrade(record.passwordHash)) {
        const replacement = await hashPassword(input.password);
        await repository.updatePasswordHash(record.user.id, replacement);
      }
      return {
        user: record.user,
        token: await tokenService.sign(record.user.id),
      };
    },
  };
}
