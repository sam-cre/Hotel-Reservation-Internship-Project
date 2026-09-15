# T6 Reservation Validation

Date: September 15, 2026

Status: Portable gate passed on `feature/reservation-engine`; normal PostgreSQL pull-request gate pending

## Delivered behavior

- Authenticated confirmed reservation creation
- Strict room, date, guest, and idempotency-key validation
- User-row locking for deterministic per-user idempotency
- Room-type row locking before availability checks
- Half-open date overlap handling and multi-unit inventory enforcement
- Server-authoritative nightly and total price snapshots
- Identical retry recovery and conflicting idempotency-key rejection
- Customer-owned reservation listing and privacy-preserving individual access
- Administrator reservation listing and status filtering
- Terminal confirmed-to-cancelled transition with inventory release
- Shared room-lock protocol across booking, cancellation, inventory edits, room deactivation, and hotel deactivation
- Expanded exact-decimal reservation total precision through migration 002

## Focused portable evidence

Command:

```powershell
npm --workspace backend test -- reservations
```

Result:

- 4 portable reservation test files passed
- 19 portable reservation tests passed
- 1 normal PostgreSQL concurrency file and its 4 tests skipped because `TEST_DATABASE_URL` was not configured

The portable cases cover creation, all overlap shapes, back-to-back stays, multiple units, capacity, inactive resources, strict fields, price snapshots, identical retries, conflicting key reuse, user-scoped keys, ownership, administrator access, status filters, terminal cancellation, and released inventory.

## Complete portable gate

Command:

```powershell
npm run verify:reservations
```

Result:

- Formatting and ESLint passed.
- Backend: 14 test files passed, 2 conditional files skipped, 100 tests passed, and 5 conditional tests skipped.
- Frontend: 1 test file and 10 tests passed.
- The production frontend build passed.
- Environment, Git exclusions, frontend serving, and API proxy checks passed.
- npm reported zero known vulnerabilities.

The five conditional tests are one normal PostgreSQL migration-driver case and four synchronized concurrency cases.

## Required pull-request gate

`.github/workflows/verification.yml` provisions a disposable PostgreSQL 17 service for each pull request to `main`. The workflow runs the complete T6 gate with `NODE_ENV=test` and a safely named test database. It must report 105 passing backend tests with no skipped test before T6 is merged.

The synchronized cases deliberately create lock contention across separate pooled connections and verify:

- exactly one of two simultaneous requests receives the final room unit
- a booking waiting behind deactivation is rejected
- a booking waiting behind cancellation observes the released unit
- a booking waiting behind a valid inventory reduction observes the reduced inventory

## Security and integrity review

- Clients cannot submit price, total, owner, role, or status during booking.
- Idempotency keys and request fingerprints are stored but never returned.
- Another customer's reservation identifier is indistinguishable from an unknown identifier.
- All reservation SQL values are parameterized.
- Money uses PostgreSQL decimal arithmetic and fixed two-decimal JSON strings.
- GitHub Actions dependencies are pinned to exact commit hashes and receive read-only repository contents permission.

## Scope boundary

Customer cancellation, payment processing, email, refresh tokens, waitlists, multi-room checkout, and status restoration remain outside the approved assignment scope. The connected reservation interface belongs to T7.
