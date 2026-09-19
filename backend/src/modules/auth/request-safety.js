import { HttpError } from '../../http/errors.js';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function requireSafeBrowserMutation(allowedOrigins) {
  return function safeBrowserMutation(req, _res, next) {
    if (!unsafeMethods.has(req.method)) return next();
    // Logout and the admin delete calls legitimately send no request body, and
    // browsers still attach Content-Length: 0 to them. Only enforce the JSON
    // content type when a body is actually present; the cross-site request
    // defenses below run for every mutation regardless.
    const declaredLength = Number(req.get('content-length'));
    const hasBody =
      req.get('transfer-encoding') !== undefined ||
      (Number.isFinite(declaredLength) && declaredLength > 0);
    if (hasBody && !req.is('application/json'))
      return next(
        new HttpError(
          415,
          'UNSUPPORTED_MEDIA_TYPE',
          'Request body must use application/json.',
        ),
      );
    if (req.get('X-CSRF-Protection') !== '1')
      return next(
        new HttpError(403, 'REQUEST_FORBIDDEN', 'Request was rejected.'),
      );
    const origin = req.get('Origin');
    if (!origin || !allowedOrigins.has(origin))
      return next(
        new HttpError(403, 'REQUEST_FORBIDDEN', 'Request was rejected.'),
      );
    const fetchSite = req.get('Sec-Fetch-Site');
    if (fetchSite && fetchSite !== 'same-origin')
      return next(
        new HttpError(403, 'REQUEST_FORBIDDEN', 'Request was rejected.'),
      );
    return next();
  };
}
