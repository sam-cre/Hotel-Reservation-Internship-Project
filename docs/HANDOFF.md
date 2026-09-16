# Engineering Handoff

Status: T1 through T7 merged; T8 validated and awaiting the project owner's Git checkpoint

Last verified: September 15, 2026

## Product

Stillwater Hotels is a React, Express, and PostgreSQL reservation application for the internship assignment. The assignment PDF controls product scope. The current repository contains a verified foundation, approved design previews, PostgreSQL infrastructure, backend authentication, catalog APIs, a transaction-safe reservation engine, and connected customer and administrator applications. Weather integration remains planned.

## Current task state

| Task           | Status               | Evidence                                          |
| -------------- | -------------------- | ------------------------------------------------- |
| T1             | Committed and pushed | Commit `97e3229` on private `main`                |
| T2             | Merged               | Pull request 1, merge commit `c2d0061`            |
| T3             | Merged               | Pull request 2, merge commit `b5d12e1`            |
| T4             | Merged               | Pull request 3, merge commit `b13fb8b`            |
| T5             | Merged               | Pull request 4, merge commit `b3e2522`            |
| T6             | Merged               | Pull request 5, merge commit `e4b8ba8`            |
| T7             | Merged               | Pull request 6 plus corrective pull requests 7-8  |
| T8             | Validated            | Complete local gate passed; owner checkpoint next |
| T9 through T12 | Planned              | See the implementation plan                       |

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

## Development commands

Run from the repository root in PowerShell:

```powershell
npm install
npm run dev
```

The Vite frontend uses `http://localhost:5173`. The Express API uses `http://localhost:3001`, and Vite proxies browser `/api` requests to Express.

Run the complete current verification:

```powershell
npm run verify:admin
```

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

T8 connects the administrator React workspace to the existing role-protected catalog and reservation APIs. It includes protected navigation, hotel and room management, reservation filtering and cancellation, destructive confirmations, server-error preservation, and mobile-safe operational tables. T9 adds the isolated backend weather integration.

The detailed acceptance criteria and verification command live in the [implementation plan](plans/implementation-plan.md) and `plan.json`.
