# Reservation Operations

Status: Implemented in T6

This guide covers authenticated booking, customer reservation access, administrator reservation management, and the concurrency rules that protect inventory. The [API contract](../architecture/api-contract.md) defines request and response shapes.

## Routes

| Method | Path                                 | Access                 | Purpose                                  |
| ------ | ------------------------------------ | ---------------------- | ---------------------------------------- |
| `POST` | `/api/reservations`                  | Authenticated          | Confirm an available room type           |
| `GET`  | `/api/reservations/my`               | Authenticated          | List the current user's reservations     |
| `GET`  | `/api/reservations/:id`              | Owner or administrator | Read one reservation                     |
| `GET`  | `/api/admin/reservations`            | Administrator          | List reservations and customer summaries |
| `PUT`  | `/api/admin/reservations/:id/status` | Administrator          | Cancel a confirmed reservation           |

All protected mutation rules from [authentication operations](authentication.md) apply. Reservation creation additionally requires an `Idempotency-Key` header containing a UUID.

## Create a reservation

The JSON body accepts only:

```json
{
  "roomId": "1",
  "checkIn": "2026-10-10",
  "checkOut": "2026-10-13",
  "guests": 2
}
```

The client cannot submit user identity, role, status, nightly price, or total price. The authenticated session supplies the user. The locked room row supplies the price, capacity, active state, and total inventory.

The server returns HTTP 201 for a new reservation. An identical retry by the same user with the same idempotency key returns the original reservation with HTTP 200. Reusing the key for different input returns HTTP 409.

## Transaction order

Reservation creation uses this order:

1. Validate the request and stay dates.
2. Begin a transaction.
3. Lock the authenticated user row.
4. Resolve an existing reservation for the same idempotency key.
5. Lock the selected active room-type row.
6. Validate guest capacity.
7. Count overlapping confirmed reservations.
8. Reject the request when occupied units equal total inventory.
9. Snapshot the locked nightly price and calculate the total in PostgreSQL.
10. Insert the confirmed reservation and commit.

The overlap predicate is:

```text
existing.check_in < requested.check_out
AND existing.check_out > requested.check_in
```

This uses half-open stays. A checkout date can be another guest's check-in date.

## Why the room lock matters

A normal transaction alone does not prevent two requests from both observing the final unit as available. `SELECT ... FOR UPDATE` places both operations in a queue for the same room-type row. The second operation continues only after the first commits or rolls back, then recounts inventory from the new database state.

The same lock is used by:

- booking
- cancellation
- room inventory and capacity edits
- room deactivation
- hotel deactivation of its room types

Using one lock target prevents booking from racing an administrator action with a stale availability count.

## Price snapshots

`price_per_night_snapshot` stores the room's locked nightly rate at confirmation. `total_price` stores that rate multiplied by the number of nights. Later room-price edits do not alter existing reservations.

PostgreSQL `numeric` performs authoritative decimal arithmetic. JSON responses serialize money as two-decimal strings to avoid browser floating-point ambiguity.

## Ownership and privacy

- Customers see only their own list.
- A customer requesting another user's reservation receives HTTP 404, identical to an unknown identifier.
- Administrators may read any reservation and receive safe customer name and email fields in the administrator list.
- Password hashes, session tokens, idempotency keys, and request fingerprints are never returned.

## Status rules

New reservations are `confirmed`. The only allowed transition is:

```text
confirmed -> cancelled
```

Cancelled is terminal. Cancellation obtains the room lock before changing status, so a waiting booking observes the released inventory. Restoring a cancelled reservation is intentionally unsupported because it could overbook a room.

## Failure behavior

- HTTP 400: malformed body, invalid identifier, missing or malformed idempotency key, past check-in, or invalid date order
- HTTP 401: missing or invalid session
- HTTP 403: customer attempts an administrator route
- HTTP 404: missing or inactive room type, missing reservation, or reservation owned by another customer
- HTTP 409: excess guests, unavailable inventory, conflicting idempotency-key reuse, or invalid status transition
- HTTP 500: unexpected failure with a safe message and request ID

## Verification

Run portable reservation tests:

```powershell
npm --workspace backend test -- reservations
```

Run the complete T6 gate:

```powershell
npm run verify:reservations
```

The portable suite verifies business behavior through an isolated PostgreSQL-compatible database. When `TEST_DATABASE_URL` identifies a disposable normal PostgreSQL database and `NODE_ENV=test`, additional synchronized tests use separate pooled connections to prove final-unit booking and mixed booking, cancellation, inventory-edit, and deactivation races. The test database name must start with `test_` or end with `_test`.
