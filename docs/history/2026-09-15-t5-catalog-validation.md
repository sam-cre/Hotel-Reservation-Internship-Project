# T5 Catalog Validation

Date: September 15, 2026

Status: Locally validated on `feature/hotel-room-apis`

## Delivered behavior

- Public active-hotel browsing with server-computed starting prices
- Case-insensitive exact city search with complete optional stay criteria
- Public hotel details and active room-type listing
- Informative availability with capacity, remaining inventory, and server-computed totals
- Half-open date overlap, so checkout does not block a same-day check-in
- Confirmed-only inventory consumption
- Strict hotel, room, identifier, date, guest, image URL, price, rating, and inventory validation
- Administrator-only hotel and room creation, replacement, and deactivation
- Historical-safe deactivation instead of destructive row deletion
- Row locking for administrator operations that can affect future inventory
- Protection against capacity or inventory reductions that contradict future confirmed reservations
- Stable validation, authentication, authorization, not-found, and conflict responses

## Focused evidence

Command:

```powershell
npm --workspace backend test -- catalog
```

Result:

- 3 test files passed
- 23 tests passed
- No focused test failed or was skipped

The focused cases cover public hotel and room reads, city search, complete-stay filtering, server-derived prices, room availability, sold-out inventory, guest capacity, back-to-back stays, cancelled reservations, soft deletion, administrator authorization, strict request fields, duplicates, missing resources, and reservation-safe inventory edits.

## Complete gate

Command:

```powershell
npm run verify:catalog
```

Result:

- Formatting and ESLint passed.
- Backend: 10 test files passed, 1 conditional file skipped, 81 tests passed, and 1 conditional test skipped.
- Frontend: 1 test file and 10 tests passed.
- The production frontend build passed.
- Environment, Git exclusions, frontend serving, and API proxy checks passed.
- npm reported zero known vulnerabilities.

The skipped test is the normal PostgreSQL driver test. It activates when `TEST_DATABASE_URL` points to a disposable PostgreSQL test database.

## Security and integrity review

- Public queries exclude inactive hotel and room records.
- All SQL values are parameterized.
- Mutation bodies reject unknown fields.
- Administrator routes reuse the verified current database role from T4.
- Monetary response values come from PostgreSQL and use fixed decimal strings.
- Soft deletion preserves foreign-key targets for reservation history.
- Availability is explicitly informative. T6 reservation creation must repeat the inventory check inside a transaction while holding the room-type row lock.

## Scope boundary

T5 does not create reservations or promise inventory to a browser. Transaction-safe booking, price snapshots, idempotency, ownership, and status transitions belong to T6. The current frontend remains a design preview and is not yet connected to the catalog routes.
