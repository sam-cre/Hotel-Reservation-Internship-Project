# Architecture Decisions

Status: Approved architecture; implementation tracked in the task plan

## ADR-001: JavaScript monorepo

Use npm workspaces with `frontend` and `backend`. Use Node.js 24 LTS and ECMAScript modules. Keep JavaScript as required by the assignment and add runtime validation, linting, tests, and database constraints instead of introducing TypeScript.

## ADR-002: Direct PostgreSQL access

Use `pg`, versioned SQL migrations, and parameterized queries. Avoid an ORM so the intern can see and explain relationships, joins, availability counts, constraints, and transactions directly.

Tradeoff: more SQL is written by hand, but the central learning objectives become visible.

## ADR-003: Secure cookie JWT

Store a short-lived JWT in an HTTP-only cookie. Proxy browser `/api` requests through Vite locally and Vercel in production. Load the current role from PostgreSQL on protected requests.

Tradeoff: proxy and CSRF defenses add configuration, but tokens are not exposed to ordinary frontend JavaScript.

## ADR-004: Room-type inventory

Treat each `rooms` row as a room type with `total_rooms` interchangeable units. Count overlapping confirmed reservations to determine remaining inventory.

Tradeoff: this is more complex than boolean availability but is required by the provided schema.

## ADR-005: Row-lock reservation protocol

Use one database transaction that locks the room-type row, rechecks inventory, calculates price, and inserts the reservation. Every cancellation, inventory edit, and deactivation that affects availability locks the same row. Use PostgreSQL's normal `READ COMMITTED` isolation with an explicit lock rather than `SERIALIZABLE` retry logic.

Tradeoff: bookings for one room type serialize briefly, which is acceptable for this small application and easier to explain reliably.

## ADR-006: Reservation lifecycle

New reservations are immediately confirmed. Confirmed reservations consume inventory, and administrators may cancel them. Cancelled reservations are terminal. A pending state is omitted because the assignment has no payment, approval, or expiring-hold workflow.

## ADR-007: Historical integrity

Hotels and room types have an `is_active` flag. API deletion deactivates records, public queries exclude them, and historical reservations still resolve them. Foreign-key restrictions provide a second line of protection against destructive data loss.

## ADR-008: Server-authoritative money

Store the booking-time nightly price and total as PostgreSQL `numeric(10,2)`. Calculate both in PostgreSQL from the locked room price and number of nights. Serialize money as two-decimal strings.

## ADR-009: Harbor Quiet design system

Use the Stillwater Hotels brand with Newsreader, Manrope, a harbor and sea-glass palette, restrained depth, image-led customer pages, structured room rows, and denser administrator tables.

## ADR-010: Open-Meteo weather

Use Open-Meteo geocoding and current-weather endpoints through the Express backend. Apply a timeout, small internal response model, short cache, and graceful fallback. No third-party booking API is used.

## ADR-011: Focused production-quality testing

Use Vitest, Supertest, React Testing Library, Playwright, and real PostgreSQL integration tests. Concentrate on required behavior, security boundaries, concurrency, accessibility, and public deployment instead of maximizing coverage percentage.

## ADR-012: Deployment

Use Vercel for the frontend, Render for the API, and Neon for PostgreSQL. Keep the GitHub repository private. Treat free-tier cold starts as an operational limitation that the UI and README explain.

## ADR-013: Human-owned Git history

The user alone stages, commits, pushes, opens pull requests, and merges. The agent supplies diffs, verification evidence, commit suggestions, and exact PowerShell commands.

## ADR-014: Stateless CSRF defenses

Require JSON and `X-CSRF-Protection: 1` on unsafe browser requests, enforce an exact origin allowlist, reject missing or foreign origins in production, and reject cross-site Fetch Metadata. Keep `SameSite=Lax` as defense in depth.

Tradeoff: strict header checks exclude unsupported non-browser clients, which is acceptable because the React application is the intended client.

## ADR-015: Idempotent reservation creation

Require a client-generated UUID idempotency key for reservation creation. Repeating an identical request with the same key returns the original reservation, while reusing the key for different input is a conflict.

Tradeoff: one extra stored field and request fingerprint prevent duplicate bookings during double submission, network retries, or uncertain responses.

## ADR-016: PostgreSQL-backed continuous integration

Run integration tests against an ephemeral PostgreSQL service container in GitHub Actions. Local tests use a dedicated test database. Do not require Docker for local development.

## ADR-017: Hidden unauthorized reservations

Return HTTP 404 when a customer requests another customer's reservation. This does not reveal whether a guessed reservation identifier exists. Use HTTP 403 for known role failures such as customer access to administrator routes.

## Review reconciliation

The rationale for accepted, refined, and rejected independent-review recommendations is recorded in [Independent review reconciliation](review-reconciliation.md).

The final design-foundation review, accessibility refinements, and owner approval are recorded in [T2 design review reconciliation](t2-design-review.md).
