# Stillwater Hotels

A hotel reservation application for the internship assignment, using React, Express, and PostgreSQL.

## Current state

The application foundation and PostgreSQL infrastructure are implemented: npm workspaces, React and Express foundations, versioned migrations, schema constraints, connection pooling, development seeds, administrator provisioning, formatting, linting, and verification.

The Harbor Quiet design foundation is validated and owner-approved, with local guest, administrator, and component previews. Reservations, database persistence, authentication, and deployment remain planned. This repository is not ready to accept real bookings.

## Design previews

After starting local development, open:

- [Guest search and room preview](http://127.0.0.1:5173/design/customer)
- [Administrator reservations preview](http://127.0.0.1:5173/design/admin)
- [Shared controls and states](http://127.0.0.1:5173/design/components)

The previews use fictional sample records. Search and sort update the URL; administrator changes exist only in browser memory and reset on reload. Booking is disabled. These routes are gated by Vite's development mode, and the production build retains the initial landing page until real application features are connected.

Fonts and photos are served locally. See [asset credits](docs/design/asset-credits.md) for provenance and licenses.

## Local development

Requirements: Node.js 24, npm 11, and Git. The application preview still starts without PostgreSQL. Database commands require a PostgreSQL connection URL.

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

Defaults allow local startup without an environment file. For overrides, copy `.env.example` to `.env` at the repository root. The backend loads that file; shell environment values take precedence. Vite reads the backend port for its local proxy without exposing backend variables to browser code.

| Variable   | Default       | Purpose                                                |
| ---------- | ------------- | ------------------------------------------------------ |
| `NODE_ENV` | `development` | Runtime mode: development, test, or production         |
| `HOST`     | `127.0.0.1`   | API bind address; cloud hosting will require `0.0.0.0` |
| `PORT`     | `3001`        | API listening port, from 1 through 65535               |

Keep the local API reachable on `127.0.0.1` for Vite proxying. Restart both development processes after changing configuration. Never store secrets in a variable prefixed `VITE_`, which is intended for public frontend configuration.

## Verification

```powershell
npm run verify:foundation
```

This checks formatting, linting, backend and frontend component tests, the frontend production build, Git exclusions, and live frontend-to-API proxy behavior on temporary local ports. `npm run verify` currently runs the same foundation checks; it will expand as features are implemented.

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
