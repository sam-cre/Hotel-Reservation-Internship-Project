# Engineering Handoff

Status: T2 validated and approved; T3 is next

Last verified: September 15, 2026

## Product

Stillwater Hotels is a React, Express, and PostgreSQL reservation application for the internship assignment. The assignment PDF controls product scope. The current repository contains a verified project foundation and approved design previews. It does not yet contain the PostgreSQL schema, authentication, live hotel APIs, or real reservation behavior.

## Current task state

| Task           | Status                       | Evidence                                                      |
| -------------- | ---------------------------- | ------------------------------------------------------------- |
| T1             | Committed and pushed         | Commit `97e3229` on private `main`                            |
| T2             | Validated and owner-approved | `npm run verify:design` passes                                |
| T3             | Next                         | PostgreSQL schema, migrations, seeds, and connection handling |
| T4 through T12 | Planned                      | See the implementation plan                                   |

## Start here

1. Read [requirements and scope](project/requirements-and-scope.md).
2. Read the [architecture overview](architecture/overview.md).
3. Read the [data model and reservation rules](architecture/data-model-and-reservations.md).
4. Read the [API contract](architecture/api-contract.md).
5. Read the [implementation plan](plans/implementation-plan.md).

## Development commands

Run from the repository root in PowerShell:

```powershell
npm install
npm run dev
```

The Vite frontend uses `http://localhost:5173`. The Express API uses `http://localhost:3001`, and Vite proxies browser `/api` requests to Express.

Run the complete current verification:

```powershell
npm run verify:design
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

## Next implementation task

T3 establishes the PostgreSQL foundation before authentication or live booking work. It must deliver versioned migrations, constraints, indexes, deterministic development data, safe administrator provisioning, and tests against a real PostgreSQL database.

The detailed acceptance criteria and verification command live in the [implementation plan](plans/implementation-plan.md) and `plan.json`.
