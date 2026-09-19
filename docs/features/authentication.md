# Authentication Operations

Status: T4 implemented and locally validated

The Express API owns account creation, credential verification, cookie sessions, and role authorization. The browser never stores a JWT directly and never supplies an authoritative role.

## Configuration

| Variable                                 | Required | Default              | Purpose                                                             |
| ---------------------------------------- | -------- | -------------------- | ------------------------------------------------------------------- |
| `JWT_SECRET`                             | Yes      | None                 | Unique signing secret with at least 32 characters                   |
| `JWT_ISSUER`                             | No       | `stillwater-api`     | Identifies tokens created by this API                               |
| `JWT_AUDIENCE`                           | No       | `stillwater-web`     | Restricts tokens to the Stillwater browser client                   |
| `JWT_TTL_MINUTES`                        | No       | `30`                 | Absolute token lifetime, limited to 5 through 60 minutes            |
| `AUTH_COOKIE_NAME`                       | No       | `stillwater_session` | Session-cookie name                                                 |
| `ALLOWED_ORIGINS`                        | Yes      | None                 | Comma-separated exact browser origins                               |
| `AUTH_RATE_LIMIT_WINDOW_MINUTES`         | No       | `15`                 | Attempt-counting window, limited to 1 through 60 minutes            |
| `AUTH_RATE_LIMIT_MAX_REQUESTS`           | No       | `20`                 | Requests allowed per limiter and window, limited to 1 through 100   |
| `AUTH_ACCOUNT_RATE_LIMIT_WINDOW_MINUTES` | No       | `60`                 | Window for the per-account login limiter, 1 through 1440 minutes    |
| `AUTH_ACCOUNT_RATE_LIMIT_MAX_REQUESTS`   | No       | `50`                 | Per-account (email-keyed) login attempts per window, 1 through 1000 |
| `TRUST_PROXY_HOPS`                       | No       | `0`                  | Known reverse proxies trusted for client IP detection, from 0 to 2  |

The backend has no fallback signing secret or allowed origin. Invalid configuration stops startup and reports only field names, never values.

Keep `TRUST_PROXY_HOPS=0` for direct local development. Set it only to the verified number of proxies in front of the API during deployment. A wrong value can either combine many guests under one rate-limit identity or trust a client-supplied forwarding header.

Generate a local signing secret in Windows PowerShell without printing it:

```powershell
$jwtBytes = New-Object byte[] 48
$jwtGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$jwtGenerator.GetBytes($jwtBytes)
$env:JWT_SECRET = [Convert]::ToBase64String($jwtBytes)
$jwtGenerator.Dispose()
```

Place a generated value in the ignored `.env` file for persistent local development. Never commit it or prefix it with `VITE_`.

## Session model

- Registration and login issue an HMAC SHA-256 JWT with subject, unique token identifier, issue time, expiration, issuer, and audience.
- The cookie uses `HttpOnly`, `SameSite=Lax`, `Path=/`, and a bounded `Max-Age`.
- Production adds `Secure`, so browsers send the cookie only over HTTPS.
- JWT verification accepts only HMAC SHA-256 and validates issuer, audience, age, expiration, signature, and a positive-integer subject.
- Each protected request loads the user from PostgreSQL. The database role, not a token claim or browser value, controls administrator access.
- Logout expires the browser cookie. Because the token is stateless, a copied token remains valid until its short expiration. Refresh tokens and a server-side denylist are intentionally outside scope.

## Password handling

- Passwords must contain 12 through 256 characters.
- Argon2id uses 19,456 KiB of memory, two iterations, one lane, and a library-generated salt.
- Unknown-email login still performs a valid dummy-hash verification. This reduces timing differences that could reveal whether an account exists.
- Existing hashes are upgraded after successful login if the configured work factors change.
- Passwords and hashes are excluded from JSON responses and server error logs.

## Browser mutation boundary

Every `POST`, `PUT`, `PATCH`, or `DELETE` API request must satisfy all of these checks:

- When the request carries a body, its `Content-Type` resolves to `application/json`. Bodyless mutations such as logout and admin deletes are exempt from the content-type check.
- `X-CSRF-Protection` equals `1`.
- `Origin` exactly matches one configured allowed origin.
- If `Sec-Fetch-Site` is present, it equals `same-origin`.

These checks defend cookie-authenticated mutations from another website. A missing `Sec-Fetch-Site` header is permitted for non-browser clients only when the exact Origin and custom header are still present.

The shared frontend Axios client sends credentials and the CSRF header on relative `/api` requests. It does not expose the signing secret or read the HttpOnly cookie.

## Rate limits

- Registration is limited by client IP address.
- Login is limited independently by client IP, by a hash of normalized email plus IP, and by the normalized email alone. The email-only limiter throttles distributed guessing against one account across rotating IPs; its window and ceiling are kept generous so an attacker cannot lock a legitimate user out.
- Responses use standard rate-limit headers and return HTTP 429 with a stable public error.
- The current store is process-local and resets when the API restarts. It is appropriate for the single Railway instance. Horizontal scaling would require a shared store before adding instances.

## Endpoint outcomes

| Endpoint                  | Success                             | Important failures                                 |
| ------------------------- | ----------------------------------- | -------------------------------------------------- |
| `POST /api/auth/register` | HTTP 201, safe user, session cookie | 400 invalid body, 409 duplicate email, 429 limited |
| `POST /api/auth/login`    | HTTP 200, safe user, session cookie | 401 generic credentials failure, 429 limited       |
| `POST /api/auth/logout`   | HTTP 204, expired session cookie    | 403 unsafe browser request                         |
| `GET /api/auth/me`        | HTTP 200, current safe user         | 401 missing, invalid, expired, or orphaned session |

All errors include the request identifier defined by the shared API error contract.

## Administrator authorization

Public registration always inserts the literal `customer` role. It rejects unknown fields, including a submitted `role`. The separate administrator provisioning command remains the only current way to create an administrator.

Future administrator routes must register both exported middleware functions in this order:

1. Authenticate the cookie and reload the current user.
2. Require the current database role to equal `admin`.

Hiding administrator controls in React is useful interface behavior but is never an authorization control.

## Verification

Run the focused T4 checks:

```powershell
npm --workspace backend test -- authentication authorization
```

Run the complete current project gate:

```powershell
npm run verify:authentication
```

The focused suite uses a migrated in-process PGlite database and non-production test keys. It does not contact a deployed service or real customer database.

## Failure handling

- Missing or invalid credentials fail closed with HTTP 401.
- A missing current user invalidates an otherwise valid token.
- Database and unexpected failures never create an authenticated context.
- Validation reports safe field names without echoing submitted values.
- The global error handler returns stable JSON and logs only an event name and request identifier for unexpected failures.

## Third-party OAuth scope boundary

Third-party OAuth identity providers (such as Google Sign-In) are explicitly out of scope for this project. Authentication is intentionally designed to be self-contained using Argon2id password hashing and secure `httpOnly` JWT cookies. Requiring external OAuth provider credentials would introduce external network dependencies, require secret exchange keys during local development, and hinder seamless, reproducible evaluation by project reviewers.
