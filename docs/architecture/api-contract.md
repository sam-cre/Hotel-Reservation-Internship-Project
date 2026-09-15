# API Contract

Status: Planning

All routes are rooted at `/api`. JSON request bodies use `Content-Type: application/json`. Protected routes require the secure authentication cookie.

## Shared conventions

- Dates use `YYYY-MM-DD`.
- Monetary values are serialized as two-decimal strings.
- Identifiers are positive integers.
- Unknown JSON fields are rejected for mutation requests.
- Invalid input returns HTTP 400.
- Missing authentication returns HTTP 401.
- Insufficient role returns HTTP 403.
- A reservation that does not exist or is not owned by the requesting customer returns HTTP 404, which does not reveal another customer's reservation identifier.
- Missing resources return HTTP 404.
- Conflicting inventory, duplicate email, conflicting idempotency-key reuse, or invalid transitions return HTTP 409.
- Unexpected failures return HTTP 500 with a safe message and request ID.
- Unsafe requests require `X-CSRF-Protection: 1`, an exact allowed `Origin`, and a non-cross-site `Sec-Fetch-Site` value in production.

## Authentication

### POST `/auth/register`

Public. Accepts `name`, `email`, and `password`. Always creates a customer. Sets the authentication cookie and returns the safe user object.

### POST `/auth/login`

Public but rate limited. Accepts `email` and `password`. Returns one generic failure message for an unknown email or incorrect password. Sets the authentication cookie on success.

### POST `/auth/logout`

Clears the authentication cookie. This route is required to make the assignment's logout feature explicit even though it was omitted from the endpoint list.

### GET `/auth/me`

Returns the current safe user object after loading the user and current role from PostgreSQL.

## Hotels

### GET `/hotels`

Public. Supported query parameters:

- `city`: optional case-insensitive city search
- `checkIn`: required when `checkOut` is supplied
- `checkOut`: required when `checkIn` is supplied
- `guests`: required with stay dates

When complete stay criteria are present, results contain only hotels with at least one room type that fits the guest count and has remaining inventory. `startingPrice` is the lowest available room-type price for that request.

Without dates, the route supports browsing and reports the lowest room-type price without claiming date availability.

### GET `/hotels/:id`

Public. Returns hotel details. It does not claim availability without complete stay criteria.

### POST `/hotels`

Administrator only. Creates a hotel from validated fields.

### PUT `/hotels/:id`

Administrator only. Replaces editable hotel values using a complete validated body.

### DELETE `/hotels/:id`

Administrator only. Deactivates the hotel and its room types without destroying historical reservation references.

## Rooms

### GET `/hotels/:hotelId/rooms`

Public. Returns room types for one hotel. Optional complete stay criteria add `remainingRooms` and `available` to each room type.

### POST `/hotels/:hotelId/rooms`

Administrator only. Creates a room type.

### PUT `/rooms/:id`

Administrator only. Replaces editable room-type values. Inventory reduction is rejected if it contradicts active reservations.

### DELETE `/rooms/:id`

Administrator only. Deactivates the room type without destroying historical reservation references.

## Availability

### GET `/rooms/availability`

Public. Requires `hotelId`, `checkIn`, `checkOut`, and `guests`. Returns matching room types with capacity, total inventory, remaining inventory, nightly price, and estimated total.

Availability responses are informative. Reservation creation always rechecks inside a protected transaction.

## Reservations

### POST `/reservations`

Authenticated customer or administrator. Accepts `roomId`, `checkIn`, `checkOut`, and `guests`. Requires an `Idempotency-Key` UUID header. It does not accept price, total, user ID, role, or status. Returns HTTP 201 with the server-created confirmed reservation. Repeating the same request and key returns the original result; reusing the key for different input returns HTTP 409.

### GET `/reservations/my`

Authenticated. Returns only reservations owned by the current user, newest first.

### GET `/reservations/:id`

Authenticated. Returns the reservation only to its owner or an administrator.

### GET `/admin/reservations`

Administrator only. Returns reservations with customer, hotel, and room-type summaries. Supports status filtering without adding general-purpose analytics.

### PUT `/admin/reservations/:id/status`

Administrator only. Accepts one allowed target status and enforces the transition rules.

## Weather

### GET `/weather`

Public. Requires `city`. The backend geocodes the city and requests current weather from Open-Meteo. It returns a small internal shape containing resolved location, temperature, apparent temperature, weather code, and wind speed.

- Request timeout: bounded
- Cache: short-lived in-memory cache
- Failure behavior: hotel details continue to work and show weather as unavailable
- External error bodies are never forwarded directly to the browser

## Health

### GET `/health`

Public. Returns process health without secrets or database contents. Deployment verification uses a separate readiness check that confirms PostgreSQL connectivity.
