# Engineering Handoff

Status: T1 through T9 merged; T10 local hardening implemented and locally validated, awaiting the project owner's Git checkpoint

Last verified: September 16, 2026

## Product

Stillwater Hotels is a React, Express, and PostgreSQL reservation application for the internship assignment. The assignment PDF controls product scope. The current repository contains a verified foundation, approved design previews, PostgreSQL infrastructure, backend authentication, catalog APIs, a transaction-safe reservation engine, connected customer and administrator applications, and an isolated weather integration.

## Current task state

| Task        | Status               | Evidence                                                               |
| ----------- | -------------------- | ---------------------------------------------------------------------- |
| T1          | Committed and pushed | Commit `97e3229` on private `main`                                     |
| T2          | Merged               | Pull request 1, merge commit `c2d0061`                                 |
| T3          | Merged               | Pull request 2, merge commit `b5d12e1`                                 |
| T4          | Merged               | Pull request 3, merge commit `b13fb8b`                                 |
| T5          | Merged               | Pull request 4, merge commit `b3e2522`                                 |
| T6          | Merged               | Pull request 5, merge commit `e4b8ba8`                                 |
| T7          | Merged               | Pull request 6 plus corrective pull requests 7-8                       |
| T8          | Merged               | Pull request 9, merge commit `c5f2698`                                 |
| T9          | Merged               | Pull request 10, merge commit `48ca2bc`                                |
| T10         | Validated locally    | Security remediation and full local gate passed; owner checkpoint next |
| T11 and T12 | Planned              | See the implementation plan                                            |

## Start here

1. Read [requirements and scope](project/requirements-and-scope.md).
2. Read the [architecture overview](architecture/overview.md).
3. Read the [data model and reservation rules](architecture/data-model-and-reservations.md).
4. Read the [API contract](architecture/api-contract.md).
5. Read the [implementation plan](plans/implementation-plan.md).
6. Read [database operations](operations/database.md) before running database commands.
7. Read [authentication operations](operations/authentication.md) before running the backend.
8. Read [catalog operations](operations/catalog.md) before changing hotel or room data.
9. Read [reservation operations](operations/reservations.md) before changing booking transactions or statuses.
10. Read [customer application operations](operations/customer-application.md) before changing routes, sessions, or booking presentation.
11. Read [administrator application operations](operations/administrator-application.md) before changing management routes or forms.
12. Read [weather operations](operations/weather.md) before changing the provider adapter, cache, or hotel weather panel.

## Development commands

Run from the repository root in PowerShell:

```powershell
npm ci
npm run dev
```

The Vite frontend uses `http://localhost:5173`. The Express API uses `http://localhost:3001`, and Vite proxies browser `/api` requests to Express.

Run the complete current verification (the canonical local gate):

```powershell
npm run verify:local
```

`npm run verify` is an alias for `npm run verify:local`. The pull-request workflow runs a pinned Gitleaks secret scan and then this same gate.

## Architecture boundaries

- The browser never controls price, role, ownership, inventory, or reservation status.
- PostgreSQL is the source of truth for users, hotels, room inventory, and reservations.
- Reservations use half-open date intervals, so checkout day does not block a new check-in.
- Every availability-changing operation must lock the same room-type row before rechecking inventory.
- Authentication uses a short-lived JWT in an HTTP-only cookie, with server-side role loading.
- Weather calls pass through Express and fail without blocking hotel details.

## Design boundaries

- Harbor Quiet is approved for both customer and administrator interfaces.
- Newsreader is reserved for display headings; Manrope handles interface text.
- Aged brass is decorative and is not a small-text color.
- Search controls share a 52px minimum height and one visual baseline.
- The custom select is non-modal and keyboard accessible.
- Sample design routes are development-only and perform no real booking mutations.

## Git and privacy boundaries

- The project owner alone stages, commits, pushes, opens pull requests, and merges.
- `AGENTS.md`, `local-workspace/`, the assignment PDF, credentials, and environment files remain outside Git.
- Peer review is optional. Request it only for material uncertainty or risk that benefits from independent analysis.

## Current and next implementation tasks

T10 completes the local hardening and defensive security audit of the owner's own code. It bounds unauthenticated weather work, enforces same-origin post-login redirects, constrains catalog image origins to an allowlist, and adds a pinned secret scanner to the pull-request gate. Registration account enumeration (SEC-300) is recorded as an accepted low risk for the no-email scope. See the [security remediation record](history/2026-09-16-t10-local-hardening-validation.md), the [assignment traceability matrix](project/assignment-traceability.md), and the [explanation readiness guide](project/explanation-readiness.md).

T11 production deployment is complete. The application is deployed with the Vercel frontend, the Railway API, and the Neon database, served under one origin so `/api/*` is proxied from Vercel to Railway. See the [production deployment runbook](operations/production-deployment.md).

The detailed acceptance criteria and verification command live in the [implementation plan](plans/implementation-plan.md) and `plan.json`.
