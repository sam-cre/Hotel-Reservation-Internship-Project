# Customer Application Operations

Status: Implemented in T7

## Purpose

The customer application connects the Harbor Quiet interface to the authentication, catalog, availability, and reservation APIs. It keeps booking authority on the server and carries the selected stay through the journey in the URL.

## Routes

| Route                          | Access           | Purpose                                                                        |
| ------------------------------ | ---------------- | ------------------------------------------------------------------------------ |
| `/` and `/search`              | Public           | Search by city, dates, and guest count; show matching hotels                   |
| `/hotels/:hotelId`             | Public           | Show hotel information and available room types for the selected stay          |
| `/login` and `/register`       | Public           | Authenticate, then return to a safe internal destination                       |
| `/reserve`                     | Customer         | Re-fetch the selected room, show the server total, and confirm the reservation |
| `/reservations`                | Customer         | List reservations owned by the signed-in customer                              |
| `/reservations/:reservationId` | Customer         | Retrieve a confirmation or historical reservation                              |
| `/information/:topic`          | Public           | Show privacy, terms, accessibility, and contact information                    |
| `/design/*`                    | Development only | Preserve approved static design previews                                       |

## Data flow

1. Search criteria are validated in the browser for prompt feedback and sent to `GET /api/hotels`.
2. The URL stores `city`, `checkIn`, `checkOut`, and `guests`, allowing navigation and refresh without losing the selected stay.
3. Hotel details fetch the hotel and qualifying room types. The API supplies remaining inventory, nightly rate, and estimated total.
4. The protected review route re-fetches the selected room. This prevents a stale search result from becoming the booking authority.
5. Confirmation submits only `roomId`, `checkIn`, `checkOut`, and `guests`, with a UUID idempotency key. The browser never sends price, total, owner, role, or status.
6. The server rechecks inventory and price inside the reservation transaction. The confirmation route retrieves the saved reservation by identifier.

## Authentication behavior

- `AuthProvider` restores the current user through `/api/auth/me`.
- Protected routes wait for restoration before deciding whether to redirect.
- Unauthenticated guests are sent to sign-in with an internal `returnTo` path.
- `returnTo` accepts only a single-slash local path, preventing an external redirect.
- Successful registration or login returns the guest to the interrupted review.
- The HTTP-only authentication cookie remains inaccessible to React.

## Asynchronous states and stale data

- Search, hotel details, review, confirmation, and reservation history provide loading, empty, failure, and success presentation as applicable.
- Fetch effects own an `AbortController` and cancel when route criteria change or the component unmounts.
- Search and hotel responses are keyed to the current URL criteria. A completed request cannot present itself as the result for a newer route.
- Mutation controls disable while a request is in progress to prevent accidental duplicate interaction. The server idempotency key provides the authoritative duplicate defense.

## Privacy and policy boundary

The application stores the cookie choice under `stillwater-cookie-choice`. Essential mode enables only session behavior and that preference. Optional services remain disabled because no analytics integration exists.

Stillwater Hotels is fictional. The guest-information pages state that the application is an internship demonstration and do not invent a support address, phone number, payment promise, or operating-hotel policy. An operating business must approve its own contact, retention, cancellation, tax, payment, and accessibility-assistance details before launch.

## Verification

Run focused component tests:

```powershell
npm --workspace frontend test -- customer
```

Run customer browser journeys:

```powershell
npm run test:e2e -- customer-journey
```

Run the complete T7 gate:

```powershell
npm run verify:customer
```

The browser suite mocks the HTTP boundary intentionally. Backend route, transaction, ownership, and PostgreSQL concurrency behavior remains covered by the T4 through T6 suites and the PostgreSQL pull-request service.

## Troubleshooting

- If every API request fails in development, confirm Express is running on the port configured for the Vite proxy.
- If a protected route repeatedly returns to sign-in, check the allowed origin, secure-cookie mode, browser cookie storage, and `/api/auth/me` response.
- If no rooms appear, verify the URL dates are valid and the development database was migrated and seeded.
- If a booking returns a conflict, treat the response as current inventory truth and return the guest to room selection.
