# Stillwater Hotels

A hotel reservation application for the internship assignment, using React, Express, and PostgreSQL.

## Current state

The application foundation is implemented: npm workspaces, a React entry page and fallback route, Express process health, safe JSON errors, environment validation, local API proxying, formatting, linting, and foundation verification.

Reservations, database persistence, authentication, the full Harbor Quiet interface, and deployment are planned. The current landing page is a temporary placeholder. This repository is not ready to accept real bookings.

## Local development

Requirements: Node.js 24, npm 11, and Git. PostgreSQL is not needed for the foundation milestone.

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

This checks formatting, linting, backend tests, the frontend production build, Git exclusions, and live frontend-to-API proxy behavior on temporary local ports. `npm run verify` currently runs the same foundation checks; it will expand as features are implemented.

Additional commands:

- `npm test`: backend tests
- `npm run lint`: source checks
- `npm run format`: apply formatting
- `npm run build`: create `frontend/dist`
- `npm run preview --workspace frontend`: preview the static build locally; API integration uses the development server until deployment routing is configured
- `npm start --workspace backend`: start the API without the file watcher

`/api/health` checks process liveness only. Database readiness will be added with PostgreSQL integration.

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
