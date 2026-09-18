# Explanation Readiness Guide

Status: Prepared in T10 for the T12 demonstration

The assignment is evaluated primarily on understanding. This guide is a study aid for explaining the system in your own words. Each topic names where the behavior lives, the key idea to convey, and a question you should be ready to answer. Read the linked source and operations documents alongside it.

## 1. Database relationships

- Where: `backend/migrations/`, `backend/src/db/`, [data model and reservations](../architecture/data-model-and-reservations.md).
- Key idea: `users`, `hotels`, `rooms`, and `reservations` follow the assignment schema. One `rooms` row is a room type holding `total_rooms` interchangeable units. One reservation books one unit of one room type, linking a `user_id` and a `room_id`. Hotels and rooms are deactivated with an `is_active` flag rather than deleted, so historical reservations keep valid foreign keys.
- Be ready to answer: Why soft delete instead of a hard delete? Because a hard delete would orphan or destroy the reservation history that references the hotel or room.

## 2. API design

- Where: `backend/src/app.js`, the module routers under `backend/src/modules/`, [API contract](../architecture/api-contract.md).
- Key idea: REST routes are grouped by resource under `/api`. Reads are public; mutations require an administrator session and a safe-browser check. Identifiers serialize as decimal strings so PostgreSQL `bigint` values keep precision in JavaScript. Unknown JSON fields on mutations are rejected.
- Be ready to answer: How is a request validated? Each route parses input with a strict Zod schema before any database work, and the database constraints repeat the critical rules.

## 3. Authentication and authorization

- Where: `backend/src/modules/auth/`, [authentication operations](../features/authentication.md).
- Key idea: Passwords are hashed with Argon2id. Login issues a short-lived JWT stored in an HttpOnly cookie. On every protected request the middleware verifies the token's algorithm, issuer, audience, and expiry, then loads the current user and role from PostgreSQL rather than trusting a role claim in the token. Public registration always creates a customer.
- Be ready to answer: Why load the role from the database on each request? So a role change or a revoked account takes effect immediately and a client cannot forge a privileged role in the token.

## 4. Reservation overlap and concurrency

- Where: `backend/src/modules/reservations/`, `backend/test/reservations/postgres-concurrency.test.js`.
- Key idea: Dates use half-open intervals. An existing reservation conflicts when its check-in is before the requested check-out and its check-out is after the requested check-in, so a checkout date is free for a new check-in the same day. Creating a reservation opens a transaction, locks the room-type row, counts overlapping confirmed reservations against `total_rooms`, and only then inserts. Every inventory-changing path (booking, cancellation, inventory edit, deactivation) takes the same row lock, so two requests for the last unit cannot both succeed.
- Be ready to answer: How do you stop two people booking the last room at once? The row lock serializes the inventory check and insert inside one transaction, so the second request sees the first reservation and is rejected.

## 5. React state and API handling

- Where: `frontend/src/features/customer/SearchPage.jsx`, `frontend/src/services/api.js`.
- Key idea: The browser calls relative `/api` routes through Axios. Search criteria live in the URL query string, so a page is shareable and reloadable. Data loads in `useEffect` with an `AbortController`, and a request key derived from the current criteria guards against a slow earlier response overwriting newer results.
- Be ready to answer: How do you prevent a stale response from replacing fresh data? Each effect aborts on cleanup, and results are only applied when their request key matches the current URL state.

## 6. Error handling

- Where: `backend/src/app.js` error middleware; `frontend/src/services/api.js` (`apiMessage`).
- Key idea: The backend maps known failures to stable codes and safe messages with a request ID, and never returns stack traces, SQL, or provider bodies. Malformed JSON returns 400, oversized bodies 413, and unexpected failures a generic 500. The frontend renders loading, empty, error, and success states and shows a safe message from the API.
- Be ready to answer: What does a client see on an unexpected server error? A generic message and a request ID, never internal details.

## 7. Weather (third-party) integration

- Where: `backend/src/modules/weather/`, [weather operations](../features/weather.md).
- Key idea: The flow is React to the Node API to Open-Meteo and back, never browser to provider. Express validates the city, geocodes it, fetches current conditions, validates both provider responses against narrow schemas, and returns one internal shape. Weather is supplemental, so any failure leaves hotel and room data intact. T10 added a per-client rate limit, a bounded concurrency limit for distinct cities, and a size-bounded cache.
- Be ready to answer: Why route weather through your backend? To keep one internal contract, hide provider details and errors, apply timeouts and limits, and satisfy the required React to Node to external API flow.

## 8. Security boundaries

- Where: [quality and security strategy](../quality/quality-and-security.md).
- Key idea: The browser never controls price, role, ownership, inventory, or status; PostgreSQL is the source of truth. Mutations require JSON, an exact allowed Origin, a custom CSRF header, and acceptable Fetch Metadata. SQL is parameterized. Authenticated responses use `Cache-Control: no-store`. T10 added same-origin redirect enforcement, a catalog image-origin allowlist, bounded weather work, and a secret scanner.
- Be ready to answer: What is the accepted risk? Registration returns a distinct conflict for an existing email (SEC-300); an indistinguishable response needs email verification, which is out of scope, so the risk is documented and accepted.

## 9. Git history and continuous integration

- Where: Git history, pull requests 1 through 10, `.github/workflows/verification.yml`.
- Key idea: Each task is a feature branch merged through a pull request only after checks pass. CI runs on pull requests to `main`, executes a pinned Gitleaks secret scan, then the `npm run verify:local` gate, with PostgreSQL integration and concurrency tests against an ephemeral database service.
- Be ready to answer: How do you keep secrets out of the repository? Ignore rules plus a pinned secret scanner in CI and a foundation check that asserts no key, certificate, or `.env` variant is tracked.

## 10. Deployment architecture (planned for T11)

- Where: [git and deployment](../operations/git-and-deployment.md).
- Key idea: The architecture serves the Vercel frontend and the Railway API under one origin. Vercel serves the built site and rewrites `/api/*` to the Railway API, which uses Neon PostgreSQL. Same-origin serving keeps the authentication cookie first-party and the cross-site request defenses intact. The application is deployed and live.
- Be ready to answer: Why Railway for the API and Neon for the database? Railway runs the Node API on a paid plan that stays warm, so there is no free-tier cold start, and Neon provides managed PostgreSQL with an ongoing free plan and pooled connections.
