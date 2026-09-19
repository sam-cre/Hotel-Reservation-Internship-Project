# API Contract

Status: Authentication, catalog, reservation, and weather routes implemented

All routes are rooted at `/api`. JSON request bodies use `Content-Type: application/json`. Protected routes require the secure authentication cookie.

## Shared conventions

- Dates use `YYYY-MM-DD`.
- Monetary values are serialized as two-decimal strings.
- Identifiers are serialized as positive decimal strings so PostgreSQL `bigint` values do not lose precision in JavaScript.
- Unknown JSON fields are rejected for mutation requests.
- Invalid input returns HTTP 400.
- Missing authentication returns HTTP 401.
- Insufficient role returns HTTP 403.
- A reservation that does not exist or is not owned by the requesting customer returns HTTP 404, which does not reveal another customer's reservation identifier.
- Missing resources return HTTP 404.
- Conflicting inventory, duplicate email, conflicting idempotency-key reuse, or invalid transitions return HTTP 409.
- Unexpected failures return HTTP 500 with a safe message and request ID.
- Unsafe requests require JSON, `X-CSRF-Protection: 1`, an exact allowed `Origin`, and `Sec-Fetch-Site: same-origin` when that browser header is present.

## Authentication

### POST `/auth/register`

Public and rate limited. Accepts only `name`, `email`, and `password`. Always creates a customer. Sets the authentication cookie and returns HTTP 201 with `{ "user": SafeUser }`. Duplicate email returns HTTP 409. Unknown fields, including `role`, return HTTP 400.

### POST `/auth/login`

Public and rate limited. Accepts only `email` and `password`. Returns one generic HTTP 401 failure for an unknown email or incorrect password. Sets the authentication cookie and returns `{ "user": SafeUser }` on success.

### POST `/auth/logout`

Clears the authentication cookie and returns HTTP 204. This route is required to make the assignment's logout feature explicit even though it was omitted from the endpoint list.

### GET `/auth/me`

Returns `{ "user": SafeUser }` after verifying the token and loading the user and current role from PostgreSQL. Missing, invalid, expired, or orphaned sessions return the same HTTP 401 response.

`SafeUser` contains decimal-string `id`, `name`, `email`, `role`, and ISO 8601 `createdAt`. Password hashes and JWT values are never included in JSON responses.

## Hotels

### GET `/hotels`

Public. Supported query parameters:

- `city`: optional case-insensitive city search
- `checkIn`: required when `checkOut` is supplied
- `checkOut`: required when `checkIn` is supplied
- `guests`: required with stay dates

When complete stay criteria are present, results contain only hotels with at least one room type that fits the guest count and has remaining inventory. `startingPrice` is the lowest available room-type price for that request.

Without dates, the route supports browsing and reports the lowest active room-type price without claiming date availability. City matching is case-insensitive, whitespace-trimmed, and exact. Results are ordered by city and hotel name.

Returns `{ "hotels": HotelSummary[] }`. A hotel summary contains decimal-string `id`, `name`, `description`, `city`, `address`, one-decimal-string `rating`, `imageUrl`, a string array `amenities`, `isActive`, ISO 8601 `createdAt`, and two-decimal-string `startingPrice`.

### GET `/hotels/:id`

Public. Returns `{ "hotel": Hotel }` for an active hotel. It does not claim availability without complete stay criteria. Missing and inactive hotels return HTTP 404.

### POST `/hotels`

Administrator only. Accepts exactly `name`, `description`, `city`, `address`, `rating`, `imageUrl`, and an optional `amenities` array. Creates a hotel and returns HTTP 201 with `{ "hotel": Hotel }`. A duplicate hotel name within the same city returns HTTP 409.

`amenities` is a list of up to 12 short non-empty strings (each 1 to 60 characters). It defaults to an empty list when omitted.

`imageUrl` accepts a same-origin managed asset path such as `/images/hotel.jpg` or an uploaded image path such as `/api/images/12` (see `POST /admin/images`). A remote image is accepted only when it is HTTPS, carries no embedded credentials, and its host appears in the server-configured `CATALOG_IMAGE_HOST_ALLOWLIST`. The allowlist is empty by default, so arbitrary remote origins are rejected with HTTP 400. Relative paths containing a backslash are rejected because browsers normalize `/\` to `//`.

### GET `/admin/hotels`

Administrator only. Returns `{ "hotels": HotelSummary[] }` for every active hotel, including hotels that have no rooms yet (their `startingPrice` is `null`). The public `GET /hotels` inner-joins active rooms and therefore omits roomless hotels, so the admin dashboard uses this endpoint instead.

### POST `/admin/images`

Administrator only. Accepts exactly `contentType` (`image/jpeg`, `image/png`, or `image/webp`) and `data` (standard base64, no data-URL prefix). The decoded bytes must be at most 5 MB and must carry a magic-byte signature matching `contentType`, otherwise HTTP 400 `INVALID_IMAGE` is returned. On success returns HTTP 201 with `{ "url": "/api/images/:id" }`, suitable for a hotel `imageUrl`.

### GET `/images/:id`

Public. Serves the stored image bytes with the recorded `Content-Type` and a long-lived immutable `Cache-Control`. A missing image returns HTTP 404.

### PUT `/hotels/:id`

Administrator only. Replaces editable hotel values using the complete POST body and returns `{ "hotel": Hotel }`.

### DELETE `/hotels/:id`

Administrator only. Deactivates the hotel and its room types in one transaction without destroying historical reservation references. Returns HTTP 204.

## Rooms

### GET `/hotels/:hotelId/rooms`

Public. Returns `{ "rooms": Room[] }` for one active hotel. Optional complete stay criteria add `remainingRooms`, `available`, and `estimatedTotal` to each active room type. The list includes rooms that do not satisfy the guest count, marked unavailable, so the hotel detail interface can explain all room choices. Results are ordered by nightly price and room name.

A room contains decimal-string `id` and `hotelId`, `name`, `description`, two-decimal-string `pricePerNight`, integer `capacity`, integer `totalRooms`, `isActive`, and ISO 8601 `createdAt`.

### POST `/hotels/:hotelId/rooms`

Administrator only. Accepts exactly `name`, `description`, numeric `pricePerNight`, integer `capacity`, and integer `totalRooms`. Creates a room type and returns HTTP 201 with `{ "room": Room }`.

### PUT `/rooms/:id`

Administrator only. Replaces editable room-type values using the same complete field set as creation. Inventory or capacity reduction is rejected with HTTP 409 if it contradicts future confirmed reservations.

### DELETE `/rooms/:id`

Administrator only. Deactivates the room type without destroying historical reservation references. Returns HTTP 204.

## Availability

### GET `/rooms/availability`

Public. Requires `hotelId`, `checkIn`, `checkOut`, and `guests`. Returns `{ "criteria": { "hotelId", "checkIn", "checkOut", "guests" }, "rooms": Room[] }`. The room list includes only active room types with sufficient capacity and positive remaining inventory. Each result contains capacity, total inventory, remaining inventory, nightly price, and estimated total.

Availability responses are informative. Reservation creation always rechecks inside a protected transaction.

Only confirmed reservations consume inventory. Date overlap uses half-open intervals: an existing reservation overlaps when its check-in is before the requested check-out and its check-out is after the requested check-in. A checkout date therefore does not block a new check-in on that same date.

## Reservations

### POST `/reservations`

Authenticated customer or administrator. Accepts exactly `roomId`, `checkIn`, `checkOut`, and `guests`. Requires an `Idempotency-Key` UUID header. It does not accept price, total, user ID, role, or status. Returns HTTP 201 with `{ "reservation": Reservation }` after creating a confirmed reservation. Repeating identical normalized input with the same user and key returns the original reservation with HTTP 200. Reusing the key for different input returns HTTP 409.

The transaction locks the user row for deterministic idempotency, then the room-type row for inventory. It rejects inactive resources, excess guests, and exhausted inventory. PostgreSQL snapshots the locked nightly price and multiplies it by the date difference.

### GET `/reservations/my`

Authenticated. Returns `{ "reservations": Reservation[] }` containing only reservations owned by the current user, newest first.

### GET `/reservations/:id`

Authenticated. Returns `{ "reservation": Reservation }` only to its owner or an administrator. A different customer receives the same HTTP 404 response as an unknown identifier.

### GET `/admin/reservations`

Administrator only. Returns `{ "reservations": Reservation[] }` with customer, hotel, and room-type summaries. The optional `status` query accepts only `confirmed` or `cancelled`.

### PUT `/admin/reservations/:id/status`

Administrator only. Accepts exactly `{ "status": "cancelled" }`. A confirmed reservation becomes cancelled and releases inventory. Cancelled is terminal, so repeated cancellation or restoration returns HTTP 409.

`Reservation` contains decimal-string `id`, `userId`, and `roomId`; date-only `checkIn` and `checkOut`; integer `guests`; two-decimal-string `pricePerNight` and `totalPrice`; `status`; ISO 8601 `createdAt`; and room and hotel summaries. Administrator list items also include the customer's safe identifier, name, and email.

## Weather

### GET `/weather`

Public and rate limited. Requires one trimmed `city` query string from 1 through 120 characters. Unknown fields and control characters are rejected. The backend geocodes the city and requests current weather from Open-Meteo. The frontend never calls the external provider directly. Requests beyond the configured per-client rate limit return HTTP 429 with `RATE_LIMITED` before any provider work.

Successful response:

```json
{
  "weather": {
    "location": "Charleston, South Carolina, United States",
    "observedAt": "2026-09-16T11:15",
    "temperature": 78.4,
    "apparentTemperature": 80.1,
    "weatherCode": 2,
    "windSpeed": 8.7,
    "units": {
      "temperature": "°F",
      "windSpeed": "mp/h"
    }
  }
}
```

- `WEATHER_LOCATION_NOT_FOUND`, HTTP 404: geocoding returned no location.
- `WEATHER_UPSTREAM_TIMEOUT`, HTTP 503: an external request exceeded its configured deadline.
- `WEATHER_UPSTREAM_UNAVAILABLE`, HTTP 503: the provider failed or returned a non-success status.
- `WEATHER_UPSTREAM_INVALID`, HTTP 503: the provider response did not match the validated contract.

Successful results use a normalized, short-lived in-memory city cache that is bounded in size with first-in eviction and drops expired entries. Concurrent requests for the same normalized city share one external lookup, and distinct cities are processed through a bounded concurrency limit so an unauthenticated request burst cannot start unlimited provider work. Failures are not cached. External bodies, URLs, and low-level errors are never forwarded to the browser. The hotel page loads weather independently, so any weather error produces a quiet unavailable state without hiding hotel or room data.

## Health

### GET `/health`

Public. Returns process health without secrets or database contents. Deployment verification uses a separate readiness check that confirms PostgreSQL connectivity.
