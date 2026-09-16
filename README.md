# Stillwater Hotels

A hotel reservation application for the internship assignment, using React, Express, and PostgreSQL.

## Current state

The application foundation, PostgreSQL infrastructure, backend authentication boundary, catalog APIs, reservation APIs, connected customer and administrator applications, and weather integration are implemented. This includes versioned migrations, schema constraints, connection pooling, development seeds, administrator provisioning, secure account sessions, public hotel search, room availability, protected reservation review, transaction-safe booking, confirmation, reservation history, hotel and room management, reservation administration, guest-information pages, consent controls, current hotel-city conditions, and automated verification.

The Harbor Quiet design foundation is validated and owner-approved. The production frontend serves the connected customer experience and the role-protected administrator workspace. Deployment work remains planned. This repository is not ready to accept production bookings.

## Design previews

After starting local development, open:

- [Guest search and room preview](http://127.0.0.1:5173/design/customer)
- [Administrator reservations preview](http://127.0.0.1:5173/design/admin)
- [Shared controls and states](http://127.0.0.1:5173/design/components)

The previews use fictional sample records. Search and sort update the URL; administrator changes exist only in browser memory and reset on reload. Booking remains disabled in preview routes. These routes are gated by Vite's development mode and remain separate from the connected customer application.

Fonts and photos are served locally. See [asset credits](docs/design/asset-credits.md) for provenance and licenses.

## Local development

Requirements: Node.js 24, npm 11, Git, and PostgreSQL for the backend. The frontend design preview can still start independently without PostgreSQL. The backend now fails closed unless its database and authentication settings are present.

From the repository root in PowerShell:

```powershell
npm ci
npm run dev
```

- Frontend: <http://127.0.0.1:5173>
- API health: <http://127.0.0.1:3001/api/health>
- API through the frontend proxy: <http://127.0.0.1:5173/api/health>
- Press Ctrl+C to stop development.

Start applications separately with `npm run dev --workspace backend` and `npm run dev --workspace frontend`.

## Environment variables

Copy `.env.example` to the ignored `.env` file at the repository root and provide the required database and authentication values. The backend loads that file; shell environment values take precedence. Vite reads the backend port for its local proxy without exposing backend variables to browser code.

| Variable                       | Default       | Purpose                                                     |
| ------------------------------ | ------------- | ----------------------------------------------------------- |
| `NODE_ENV`                     | `development` | Runtime mode: development, test, or production              |
| `HOST`                         | `127.0.0.1`   | API bind address; cloud hosting will require `0.0.0.0`      |
| `PORT`                         | `3001`        | API listening port, from 1 through 65535                    |
| `TRUST_PROXY_HOPS`             | `0`           | Known reverse-proxy hops used for client IP detection       |
| `WEATHER_TIMEOUT_MS`           | `4000`        | Maximum time allowed for each Open-Meteo request            |
| `WEATHER_CACHE_TTL_MS`         | `600000`      | Successful city weather cache duration                      |
| `WEATHER_MAX_IN_FLIGHT`        | `4`           | Concurrent distinct-city provider lookups allowed           |
| `WEATHER_MAX_CACHE_ENTRIES`    | `500`         | Maximum cached cities before first-in eviction              |
| `WEATHER_RATE_LIMIT_WINDOW_MS` | `60000`       | Public weather rate-limit window                            |
| `WEATHER_RATE_LIMIT_MAX`       | `60`          | Public weather requests allowed per window per client       |
| `CATALOG_IMAGE_HOST_ALLOWLIST` | (empty)       | Comma-separated HTTPS hosts allowed for remote hotel images |

Database variables are documented in [database operations](docs/operations/database.md). JWT, cookie, origin, and rate-limit variables are documented in [authentication operations](docs/operations/authentication.md). Keep the local API reachable on `127.0.0.1` for Vite proxying. Restart both development processes after changing configuration. Never store secrets in a variable prefixed `VITE_`, which is intended for public frontend configuration.

## Verification

```powershell
npm run verify:local
```

This canonical gate checks formatting, linting, backend and frontend component tests, the production build, Git exclusions, the secret-scan configuration and its canary, the live frontend-to-API proxy, dependency advisories, and all connected customer and administrator Playwright journeys. `npm run verify` is an alias for it. The pull-request workflow runs a pinned Gitleaks secret scan and then this same gate; its PostgreSQL integration and concurrency tests run against an ephemeral database service and are skipped locally when `TEST_DATABASE_URL` is absent.

The complete design check also runs Chromium browser tests:

```powershell
npm exec playwright -- install chromium
npm run verify:design
```

Browser checks cover 320px, 390px, 640px, 960px, and 1440px layouts, accessibility assertions, 200 percent text scaling, search history, custom-select behavior, favicon delivery, dialogs, sample cancellation, reduced motion, and production route isolation. Screenshots and failure traces are written to the ignored `test-results/` directory. Test servers use ports 5175 and 4175 and stop after the run.

Additional commands:

- `npm test`: backend and frontend component tests
- `npm run test --workspace frontend -- design-system`: focused design component tests
- `npm run test:design-browser`: browser checks against local development and the most recent production build; run `npm run build` first
- `npm run test:e2e -- customer-journey`: connected customer browser journeys with mocked network boundaries
- `npm run test:e2e -- admin-journey`: connected administrator browser journeys with mocked network boundaries
- `npm run lint`: source checks
- `npm run format`: apply formatting
- `npm run build`: create `frontend/dist`
- `npm run preview --workspace frontend`: preview the static build locally; API integration uses the development server until deployment routing is configured
- `npm start --workspace backend`: start the API without the file watcher

`/api/health` checks process liveness only. Database readiness will be added with PostgreSQL integration.

## Database foundation

T3 provides versioned migrations, PostgreSQL connection pooling, deterministic development data, and explicit administrator provisioning. See [database operations](docs/operations/database.md) for configuration, safety boundaries, commands, and recovery guidance.

```powershell
npm run test:database
npm run verify:database
```

## Authentication foundation

T4 provides registration, login, logout, current-user restoration, secure JWT cookies, current-role authorization, browser mutation defenses, and bounded authentication attempts. See [authentication operations](docs/operations/authentication.md) for configuration, endpoint behavior, security boundaries, and limitations.

```powershell
npm --workspace backend test -- authentication authorization
npm run verify:authentication
```

## Hotel and room catalog APIs

T5 provides public hotel browsing, exact city search, hotel details, room types, stay availability, server-computed starting prices, and administrator hotel and room management. Deletion deactivates records so reservation history can retain its references. See [catalog operations](docs/operations/catalog.md) and the [API contract](docs/architecture/api-contract.md).

```powershell
npm --workspace backend test -- catalog
npm run verify:catalog
```

## Reservation APIs

T6 provides authenticated booking, server-authoritative price snapshots, deterministic idempotent retries, customer-owned reservation history, administrator reservation listing, and terminal cancellation. All availability-changing operations use the same room-type row lock. See [reservation operations](docs/operations/reservations.md) and the [reservation model](docs/architecture/data-model-and-reservations.md).

```powershell
npm --workspace backend test -- reservations
npm run verify:reservations
```

## Customer application

T7 provides hotel search, URL-preserved stay criteria, hotel and room details, registration and sign-in, protected reservation review, booking confirmation, My Reservations, substantive guest-information pages, and reopenable cookie preferences. The browser uses relative `/api` routes and never supplies a booking price or role. See [customer application operations](docs/operations/customer-application.md).

```powershell
npm --workspace frontend test -- customer
npm run test:e2e -- customer-journey
npm run verify:customer
```

## Administrator application

T8 provides role-protected administrator navigation, reservation filtering and cancellation, hotel management, room management, destructive confirmations, and conflict-preserving forms. React blocks customer accounts before administrator data calls, while Express remains the authoritative role boundary. See [administrator application operations](docs/operations/administrator-application.md).

```powershell
npm --workspace frontend test -- admin
npm run test:e2e -- admin-journey
npm run verify:admin
```

## Weather integration

T9 adds current hotel-city conditions through an Express-owned Open-Meteo adapter. The browser calls only the internal `/api/weather` route. The adapter validates provider responses, limits request duration, coalesces simultaneous city lookups, caches successful results briefly, and returns a stable internal shape. Weather remains supplemental, so provider failure leaves hotel and room details usable. See [weather operations](docs/operations/weather.md).

```powershell
npm --workspace backend test -- weather
npm --workspace frontend test -- customer
npm run verify:weather
```

## Structure

- `frontend/`: React application and Vite configuration
- `backend/`: Express application, server startup, configuration, and tests
- `scripts/`: repository verification
- `docs/`: requirements, architecture, design, quality, and deployment plans
- `plan.json`: approved task queue

## Deployment

Frontend URL: not deployed.

API URL: not deployed.

See the [documentation index](docs/README.md) and [implementation plan](docs/plans/implementation-plan.md) for scope, decisions, and remaining milestones.
