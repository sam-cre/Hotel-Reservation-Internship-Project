# Implementation Plan

Status: Approved; T1 committed, T2 validated and approved, T3 through T12 planned

The canonical machine-readable plan is `/plan.json`. If this summary and the JSON disagree, the JSON is authoritative.

## Goal

Build, verify, document, and deploy the Stillwater Hotels internship application within 1.5 weeks while preserving human-owned Git history.

## Success

- Every mandatory assignment requirement has implementation and verification evidence.
- The public frontend and API work with Neon persistence.
- Critical security, concurrency, accessibility, and deployment checks pass.
- No secrets or local-only instructions enter Git.
- The user can explain every evaluation topic.

## Scope and constraints

- In scope: every mandatory assignment feature, Harbor Quiet design, targeted production-quality safeguards, testing, documentation, Git workflow, and deployment
- Out of scope: payments, customer cancellation, email, dynamic pricing, multiple-room checkout, uploads, microservices, and a complete property-management system
- Calendar limit: 1.5 weeks
- Estimated focused effort: approximately 55 hours
- Language: JavaScript
- Runtime: Node.js 24 LTS
- Git ownership: the user alone stages, commits, pushes, opens pull requests, and merges

## Task queue

### T1. Safe project foundation

- Status: Verified and committed by the project owner as `97e3229`, pushed to private `main`
- Evidence: `npm run verify:foundation` passed with 11 backend tests, formatting, linting, a production frontend build, environment and ignore checks, and live API proxy checks. The documented `npm run dev` command also served the frontend and both health URLs successfully.
- Satisfies: R1, R12, R13
- Depends on: none
- Deliver: npm workspaces, Vite and Express skeletons, ignore rules, environment example, health endpoints, linting, formatting, and foundation checks
- Verify: `npm run verify:foundation` and committed `.gitignore` content checks
- Estimate: 150 minutes

### T2. Harbor Quiet design foundation

- Status: Validated and approved; ready for the project owner's Git checkpoint
- Evidence: Shared controls, sample guest and administrator pages, and a component gallery run locally. Ten component tests and 27 browser tests cover interactions, accessible labels, contrast, 200 percent text scaling, narrow layouts, focus management, the custom select, favicon delivery, control alignment, dialog spacing, cookie choices, and production isolation. The owner approved the visual direction on September 15, 2026.
- Satisfies: R9, R14
- Depends on: T1
- Deliver: fonts, tokens, identity and favicon, foundational components, customer search preview, administrator table preview, desktop and mobile review
- Verify: `npm --workspace frontend test -- design-system`
- Browser verification: `npm run verify:design`
- Human gate: approve screenshots before broad UI implementation
- Estimate: 210 minutes

### T3. PostgreSQL schema and migrations

- Satisfies: R7, R10, R12
- Depends on: T1
- Deliver: migrations, constraints, indexes, active-record flags, price snapshots, idempotency fields, connection handling, development seeds, and idempotent administrator provisioning
- Verify: `npm --workspace backend test -- database`
- Estimate: 240 minutes

### T4. Authentication and authorization

- Satisfies: R2, R6, R10, R14
- Depends on: T3
- Deliver: registration, login, logout, `/auth/me`, Argon2id, secure cookie JWT, current role loading, strict custom-header, origin, and Fetch Metadata defenses, and rate limits
- Verify: `npm --workspace backend test -- authentication authorization`
- Estimate: 300 minutes

### T5. Hotel, room, search, and availability APIs

- Satisfies: R3, R6, R7, R10
- Depends on: T3, T4
- Deliver: required CRUD routes with historical-safe deactivation, hotel search, details, room types, capacity filtering, inventory results, and starting price
- Verify: `npm --workspace backend test -- hotels rooms availability`
- Estimate: 300 minutes

### T6. Transaction-safe reservation engine

- Satisfies: R4, R5, R6, R7, R10, R14
- Depends on: T5
- Deliver: universal inventory locking, overlap counting, multi-unit inventory, nightly and total price snapshots, idempotent creation, ownership, listing, and confirmed-to-cancelled status changes
- Verify: `npm --workspace backend test -- reservations concurrency pricing ownership`
- Critical gate: synchronized concurrent requests for the final unit produce exactly one reservation, and mixed booking and administrator races preserve valid inventory
- Estimate: 480 minutes

### T7. Customer application

- Satisfies: R2, R3, R4, R5, R9, R10
- Depends on: T2, T4, T5, T6
- Deliver: home, search results, hotel details, authentication, reservation review, confirmation, My Reservations, structured footer navigation, guest-support links, and cookie-preference controls
- Verify: customer component tests and `npm run test:e2e -- customer-journey`
- Estimate: 420 minutes

### T8. Administrator application

- Satisfies: R6, R9, R10
- Depends on: T2, T4, T5, T6
- Deliver: protected administration, hotel forms, room forms, reservation table, status updates, and destructive confirmations
- Verify: administrator component tests and `npm run test:e2e -- admin-journey`
- Estimate: 300 minutes

### T9. Weather integration

- Satisfies: R8, R9, R10
- Depends on: T5, T7
- Deliver: backend Open-Meteo integration, mapping, timeout, cache, and graceful UI fallback
- Verify: backend and frontend weather tests
- Estimate: 180 minutes

### T10. Local hardening and security audit

- Satisfies: R1, R2, R4, R6, R9, R10, R12
- Depends on: T7, T8, T9
- Deliver: requirement audit, launch-readiness audit, lint, tests, builds, PostgreSQL-backed CI, accessibility, responsive review, metadata and link validation, asset budgets, secret review, dependency review, and security audit
- Verify: `npm run verify:local`
- Estimate: 300 minutes

### T11. Production deployment

- Satisfies: R1, R2, R8, R11, R13
- Depends on: T10
- Deliver: Neon database, Render API, Vercel frontend, migrations, administrator, secrets, rewrites, HTTPS and security headers, robots and sitemap behavior, public metadata, and cold-start, CSRF, consent, cookie, cache, and broken-link smoke tests
- Verify: `npm run smoke:production`
- Estimate: 240 minutes

### T12. Documentation and explanation readiness

- Satisfies: R12, R13, R14
- Depends on: T11
- Deliver: evidence-grounded README, API and architecture references, public URLs, requirement matrix, setup verification, launch-readiness evidence, owner-reviewed guest-policy content, and demonstration guide
- Verify: `npm run verify:docs`, README content checks, and final `npm run verify`
- Estimate: 180 minutes

## Requirement coverage

- R1: T1, T10, T11
- R2: T4, T7, T10, T11
- R3: T5, T7
- R4: T6, T7, T10
- R5: T6, T7
- R6: T4, T5, T6, T8, T10
- R7: T3, T5, T6
- R8: T9, T11
- R9: T2, T7, T8, T9, T10
- R10: T3 through T10
- R11: T11
- R12: T1, T3, T10, T12
- R13: T1, T11, T12
- R14: T2, T4, T6, T12

Every must-have requirement is covered by at least one task.

## Human Git gate after each coherent phase

- Agent reports the diff and verification evidence.
- Agent provides an exact PowerShell block marked clearly as safe to run.
- User reviews, stages explicit paths, reviews the staged diff, commits, and pushes.
- No later task treats an unverified phase as complete.

## Stop policy

- Three verification attempts per task
- Must-have work is never silently dropped
- A blocked dependency blocks dependent tasks
- Confirmed security remediation requires user approval before edits
- No implementation begins while plan approval is `awaiting-approval`

## Honest limitation

The plan validator proves structural completeness, not that every test is a perfect judge of correctness. Independent batch review, human Git review, and production smoke testing provide additional checks.
