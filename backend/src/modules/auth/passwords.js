import argon2 from 'argon2';

export const passwordHashOptions = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});

const dummyPasswordHash =
  '$argon2id$v=19$m=19456,p=1,t=2$c3RpbGx3YXRlci1kdW1teSE$NTZwXEFhJ2ieDBCpJ5Tj9Wn9j6TOTdq94hOZsf41+kA';

export function hashPassword(password) {
  return argon2.hash(password, passwordHashOptions);
}

export function verifyPassword(passwordHash, password) {
  return argon2.verify(passwordHash, password);
}

export function verifyDummyPassword(password) {
  return argon2.verify(dummyPasswordHash, password);
}

export function passwordHashNeedsUpgrade(passwordHash) {
  return argon2.needsRehash(passwordHash, passwordHashOptions);
}
