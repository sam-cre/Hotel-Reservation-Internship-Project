import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

const algorithm = 'HS256';

export function createTokenService(config) {
  const key = new TextEncoder().encode(config.secret);

  return {
    async sign(userId) {
      return new SignJWT({})
        .setProtectedHeader({ alg: algorithm, typ: 'JWT' })
        .setSubject(String(userId))
        .setIssuer(config.issuer)
        .setAudience(config.audience)
        .setJti(randomUUID())
        .setIssuedAt()
        .setExpirationTime(`${config.ttlSeconds}s`)
        .sign(key);
    },

    async verify(token) {
      const result = await jwtVerify(token, key, {
        algorithms: [algorithm],
        issuer: config.issuer,
        audience: config.audience,
        maxTokenAge: `${config.ttlSeconds}s`,
        clockTolerance: 5,
      });
      if (!/^[1-9]\d*$/.test(result.payload.sub ?? ''))
        throw new Error('Invalid token subject.');
      return result.payload.sub;
    },
  };
}
