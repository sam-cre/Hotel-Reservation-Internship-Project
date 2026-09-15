# Independent Review Reconciliation

Status: Approved

This record reconciles the independent architecture and design review with the assignment specification. The assignment remains controlling when a recommendation changes scope or conflicts with an explicit requirement.

## Accepted

- Use one room-type row lock for every operation that affects availability, not only reservation creation.
- Snapshot both nightly price and total price on the reservation.
- Deactivate hotels and room types instead of destructively deleting records referenced by history.
- Require explicit, fail-closed CSRF checks for unsafe production requests.
- Make administrator provisioning idempotent and dependent on explicit environment credentials.
- Document that cookie logout does not revoke an already copied stateless JWT, then limit exposure with a short expiry.
- Preserve search criteria in the URL and cancel stale requests.
- Verify that the Vercel rewrite preserves authentication `Set-Cookie` attributes.
- Add targeted `aria-live` announcements for meaningful asynchronous changes.
- Run database integration and concurrency tests against real PostgreSQL in continuous integration.
- Add idempotent reservation creation to make double submission and uncertain network retries safe.

## Refined

- Remove `pending` rather than inventing an expiration job. The assignment has no payment or manual approval step, so reservations are immediately `confirmed` and may later become `cancelled`.
- Use synchronized parallel requests for concurrency tests. `Promise.all` may launch the calls, but a test barrier ensures both transactions contend for the same final unit.
- Retain npm workspaces. Two small packages, one lockfile, and root verification commands improve reproducibility without creating runtime architecture.
- Retain shared CSS tokens and components, but do not create a separately versioned design-system package.
- Keep a bounded in-memory authentication rate limit. A distributed database-backed limiter is unnecessary for one free Render instance and is documented as resetting when the process restarts.
- Preserve the ledger idea only in the stay line, tabular numerals, booking folio, and administrator tables. Harbor Quiet remains the approved visual direction.

## Rejected

- Do not replace row locking with a per-night ledger or PostgreSQL exclusion constraint. The assignment models multiple interchangeable units, while a simple exclusion constraint models exclusive occupancy and would not enforce a capacity greater than one.
- Do not add refresh tokens or a token blacklist. Short-lived cookie JWTs meet the project scope with less security-sensitive machinery.
- Do not add React Router data loaders and actions. The assignment explicitly requires Axios, and focused service functions plus component hooks are easier for the intern to explain.
- Do not replace Open-Meteo. It is the assignment's recommended external integration and already supplies geocoding and current weather.
- Do not require local Docker. Docker is optional in the assignment and absent on the current machine; CI still tests against genuine PostgreSQL.
- Do not automatically retry reservation mutations. Idempotency makes a deliberate retry safe, but automatic booking retries create confusing user behavior.

## Corrected factual claim

The review warned that Vercel external rewrites time out after 10 seconds. Current Vercel documentation specifies a 120-second proxied-request limit. The production smoke test will still verify real cold-start and cookie behavior because provider limits can change.

## Resolved owner decisions

- Reservation lifecycle: `confirmed` to `cancelled`; no pending hold.
- Unauthorized reservation lookup: HTTP 404 for a non-owner customer.
- Visual direction: Harbor Quiet with selected ledger details, not a full Travel Ledger pivot.
- Local database workflow: dedicated test database; PostgreSQL service container in GitHub Actions; no local Docker requirement.
