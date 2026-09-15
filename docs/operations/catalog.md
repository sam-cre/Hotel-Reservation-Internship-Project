# Catalog Operations

Status: Implemented in T5

This guide covers hotel, room-type, search, and informative availability behavior. The [API contract](../architecture/api-contract.md) is the source of truth for route shapes.

## Operating boundary

- Public catalog reads require no session.
- Hotel and room mutations require a current administrator session.
- All mutation requests must satisfy the authentication guide's JSON, exact-origin, Fetch Metadata, and CSRF-header rules.
- The API calculates starting prices, nightly prices, remaining units, and estimated totals from PostgreSQL values. Browser-submitted price values never influence public results.
- Availability is informative until T6 adds transactional reservation creation. A booking request must recheck inventory while holding the room-type row lock.

## Public routes

| Method | Path                         | Purpose                                                    |
| ------ | ---------------------------- | ---------------------------------------------------------- |
| `GET`  | `/api/hotels`                | Browse active hotels or search by city and a complete stay |
| `GET`  | `/api/hotels/:id`            | Read one active hotel                                      |
| `GET`  | `/api/hotels/:hotelId/rooms` | Read active room types, optionally with stay availability  |
| `GET`  | `/api/rooms/availability`    | Read available room types for one hotel and complete stay  |

A complete stay contains `checkIn`, `checkOut`, and `guests`. Dates use `YYYY-MM-DD`. Check-in cannot be before the server's current date, and check-out must be later than check-in. Search city matching is case-insensitive after surrounding whitespace is removed, but otherwise exact. Results use deterministic city, hotel name, room price, and room name ordering.

Use PowerShell to inspect the seeded Charleston catalog:

```powershell
$apiBase = 'http://127.0.0.1:3001/api'
Invoke-RestMethod -Method Get -Uri "$apiBase/hotels?city=Charleston&checkIn=2026-10-10&checkOut=2026-10-13&guests=2"
```

Use future dates when running this example after October 2026.

## Administrator routes

| Method   | Path                         | Purpose                               |
| -------- | ---------------------------- | ------------------------------------- |
| `POST`   | `/api/hotels`                | Create a hotel                        |
| `PUT`    | `/api/hotels/:id`            | Replace editable hotel values         |
| `DELETE` | `/api/hotels/:id`            | Deactivate a hotel and its room types |
| `POST`   | `/api/hotels/:hotelId/rooms` | Create a room type                    |
| `PUT`    | `/api/rooms/:id`             | Replace editable room-type values     |
| `DELETE` | `/api/rooms/:id`             | Deactivate a room type                |

`PUT` uses replacement semantics. Send every editable field, not a partial patch. Unknown fields are rejected so accidental or privileged values cannot be silently accepted.

Deletion is a soft delete. It changes `is_active` to false and preserves the row. This keeps future reservation history connected to its original hotel and room records. Deactivating a hotel also deactivates its room types in the same transaction.

## Inventory safety

Room updates and deletions lock the target room row. Hotel deletion and room creation lock the relevant hotel row. These shared locks establish the order that T6 reservation transactions must follow.

An administrator cannot reduce:

- `totalRooms` below the maximum number of overlapping future confirmed reservations
- `capacity` below the largest guest count on a future confirmed reservation

This prevents an administrative edit from making already confirmed future stays invalid. T6 will add synchronized tests proving the booking and administrator paths preserve the same invariant under simultaneous requests.

## Availability semantics

Reservations overlap when an existing check-in is before the requested check-out and the existing check-out is after the requested check-in. Checkout is therefore reusable by a new guest checking in on the same date.

Only `confirmed` reservations consume inventory. Cancelled reservations remain historical records but do not block rooms. `remainingRooms` equals total room units minus overlapping confirmed reservations. `estimatedTotal` equals the database nightly rate multiplied by the number of nights.

## Failure behavior

- HTTP 400: malformed identifiers, incomplete stay criteria, invalid dates, unknown fields, or invalid values
- HTTP 401: missing or invalid session on an administrator route
- HTTP 403: authenticated customer attempts an administrator route
- HTTP 404: missing or inactive public resource
- HTTP 409: duplicate hotel or room identity, or an inventory reduction that conflicts with future confirmed reservations
- HTTP 500: unexpected server failure with a safe message and request ID

Database constraint names and query details are not returned to clients.

## Verification

Run the focused catalog tests:

```powershell
npm --workspace backend test -- catalog
```

Run the complete T5 gate:

```powershell
npm run verify:catalog
```

The normal PostgreSQL driver test remains conditional on `TEST_DATABASE_URL`. Catalog integration tests use an isolated in-process PostgreSQL-compatible database and reset synthetic records between tests.
