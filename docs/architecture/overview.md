# Architecture Overview

Status: Foundation, database infrastructure, core APIs, connected applications, and weather integration implemented; hardening and deployment remain planned

## System shape

The project is a small monorepo with two deployable applications and one managed database.

```text
Browser
  |
  | HTTPS to the Vercel origin
  v
React and Vite frontend on Vercel
  |
  | /api/* external rewrite
  v
Node.js and Express API on Render
  |                         |
  | pooled TLS connection   | bounded HTTPS request
  v                         v
Neon PostgreSQL          Open-Meteo
```

Vercel presents the frontend and API path as one browser origin. Express remains independently reachable through its public Render URL, as required by the assignment.

## Technology choices

- Node.js 24 LTS
- npm workspaces
- ECMAScript modules
- React with Vite
- React Router
- Axios
- CSS Modules plus shared CSS custom-property tokens
- Express
- `pg` for direct PostgreSQL access
- Zod for request and environment validation
- Argon2id for password hashing
- JWT authentication in secure HTTP-only cookies
- Vitest for unit and component tests
- Supertest for API integration tests
- Playwright for critical browser journeys
- ESLint and Prettier for consistent source quality

Plain JavaScript is intentional. It follows the assignment directly and avoids adding a second language-learning burden. Runtime validation, database constraints, tests, and linting provide the quality controls.

## Repository shape

```text
frontend/
  src/
    app/
    components/
    features/
    pages/
    services/
    styles/
backend/
  src/
    config/
    db/
    middleware/
    modules/
    app.js
    server.js
  migrations/
  seeds/
docs/
package.json
README.md
.env.example
.gitignore
```

Backend modules are grouped by product capability: authentication, hotels, rooms, reservations, and weather. Each module owns its routes, validation, service logic, and database queries. This keeps related behavior together without adding excessive architectural layers.

The authentication module separates HTTP routing, validation, password hashing, token operations, cookie serialization, request-safety checks, rate limits, and parameterized database access. Express composes these parts once at startup. Future modules receive reusable authentication and administrator-authorization middleware without reading cookie or JWT details themselves.

The catalog module separates route handling, strict request validation, domain rules, response mapping, and parameterized PostgreSQL queries. Public queries expose only active hotels and room types. Administrator deletion changes active state instead of removing rows, preserving references needed by future reservation history. Search and availability calculate prices and remaining inventory on the server from database values.

The reservation module owns booking validation, idempotency fingerprints, transaction boundaries, ownership rules, price snapshots, status transitions, and reservation response mapping. Booking, cancellation, room inventory edits, and room deactivation all serialize through the same room-type row lock before changing availability-related state.

The weather module owns provider URLs, request deadlines, geocoding, current-condition lookup, response validation, mapping, duplicate-request coalescing, and a bounded in-memory cache. The browser receives only the internal weather contract and never depends on Open-Meteo response fields. Provider failure is isolated from hotel and inventory requests.

## Frontend state

- URL state holds city, dates, guest count, filters, and selected hotel identifiers.
- Component state holds temporary form input and display controls.
- Authentication context holds the current user returned by `/api/auth/me`.
- The server remains authoritative for identity, roles, availability, price, and reservation status.
- Redux is not needed for this scope.
- Axios requests use cancellation so stale search responses cannot overwrite newer URL-driven results.

## Error contract

Every API error uses one stable structure:

```json
{
  "error": {
    "code": "ROOM_UNAVAILABLE",
    "message": "That room type is no longer available for these dates.",
    "details": {},
    "requestId": "generated-request-id"
  }
}
```

Messages are safe for customers. Internal stack traces and database details are logged only on the server and are never returned in production.

## Trust boundaries

- Browser input is untrusted.
- JWT claims are untrusted until signature and claim validation pass.
- Client role state never grants access.
- Database results containing prior user input remain untrusted for HTML rendering.
- Open-Meteo responses are untrusted external data and are reduced to a small internal weather shape.
- Environment variables are trusted only after startup validation.

## Browser mutation boundary

Unsafe requests use JSON, an exact configured origin, a required `X-CSRF-Protection: 1` header, and Fetch Metadata checks. The API rejects a missing or foreign `Origin`. When `Sec-Fetch-Site` is present, only `same-origin` is accepted. This is intentionally strict because the supported client is the same-origin React application.
