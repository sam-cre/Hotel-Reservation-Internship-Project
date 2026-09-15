export function readCookie(cookieHeader, name) {
  if (!cookieHeader || cookieHeader.length > 8192) return null;
  for (const pair of cookieHeader.split(';')) {
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name)
      return pair.slice(separator + 1).trim();
  }
  return null;
}

function attributes(config, maxAge) {
  const values = [`Max-Age=${maxAge}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (config.secureCookie) values.push('Secure');
  return values.join('; ');
}

export function createSessionCookie(token, config) {
  return `${config.cookieName}=${token}; ${attributes(config, config.ttlSeconds)}`;
}

export function createExpiredSessionCookie(config) {
  return `${config.cookieName}=; ${attributes(config, 0)}`;
}
