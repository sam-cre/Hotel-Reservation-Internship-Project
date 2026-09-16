# T7 Customer Application Validation

Date: September 15, 2026

Status: Complete local gate passed on `feature/customer-application`; owner Git checkpoint pending

## Delivered behavior

- Responsive customer header, mobile navigation, footer, and approved Stillwater identity
- Live hotel search using city, check-in, check-out, and guest count
- URL-preserved search criteria across results, hotel details, authentication, and review
- Hotel details and server-filtered room availability
- Account registration, login, logout, and current-session restoration
- Safe internal return after authentication
- Protected reservation review with server-provided nightly rate and total
- UUID idempotency key and strict price-free booking payload
- Confirmation retrieval and customer-owned reservation history
- Loading, empty, failure, and success states across asynchronous surfaces
- Request cancellation and URL-keyed stale-result protection
- Privacy, reservation terms, accessibility, and honest project-contact pages
- Essential-only and optional cookie choices with footer reopening

## Focused component evidence

Command:

```powershell
npm --workspace frontend test -- customer
```

Result:

- 1 focused test file passed
- 5 focused tests passed

The tests cover live result rendering, exact URL continuity, room totals returned by the API, protected routing, registration return, strict reservation payloads, confirmation, privacy content, cookie reopening, and empty reservation history.

## Browser evidence

Command:

```powershell
npm run test:e2e -- customer-journey
```

Result:

- 3 Chromium journeys passed
- Complete registration-through-confirmation journey passed
- My Reservations retrieval passed
- Axe reported zero violations on the customer search result page
- The 320px viewport had no horizontal overflow
- Guest-information and cookie-reopening behavior passed

## Complete T7 gate

Command:

```powershell
npm run verify:customer
```

Result:

- Formatting and ESLint passed.
- Backend: 14 test files passed, 2 conditional files skipped, 100 tests passed, and 5 normal PostgreSQL tests skipped locally.
- Frontend: 2 test files and 15 tests passed.
- The production frontend build passed.
- Environment, Git exclusions, frontend serving, and API proxy checks passed.
- npm reported zero known vulnerabilities.
- All 3 customer Playwright journeys passed.

The five locally skipped backend tests already passed against PostgreSQL 17 in the T6 pull-request workflow. The original 27-test T2 browser suite also passed after the connected application was added.

The initial T7 pull-request workflow completed all PostgreSQL and frontend tests and the production build, then timed out while closing the temporary verification servers. GitHub marked the job cancelled, but GitHub CLI returned exit code 0 and the owner's scripted merge continued. A first corrective run proved that Vite retained an internal Linux file watcher after its HTTP connections closed. The final cleanup requests graceful shutdown, closes all HTTP connections, closes the API normally, and explicitly exits the one-shot verification subprocess only when that Vite watcher exceeds its cleanup deadline. Pull request 8 then passed the complete PostgreSQL, frontend, production-build, proxy, dependency, and customer-browser gate in 2 minutes 36 seconds.

## Visual review

Desktop and 320px full-page captures were inspected during implementation. The review confirmed:

- one baseline for desktop search controls
- no mobile horizontal overflow
- readable two-column stay details at 320px
- full-service hotel imagery and property presentation
- consistent folio, border, typography, and spacing language
- structured footer visibility without crowding the primary booking flow

Temporary screenshots remained in the ignored test-results directory and are not part of the repository.

## Security and integrity review

- The browser never submits price, total, owner, role, or reservation status.
- Booking uses a UUID idempotency key that remains stable for one confirmation attempt.
- Authentication is restored through the HTTP-only cookie boundary.
- Protected routes wait for authentication restoration before redirecting.
- Authentication return paths reject protocol-relative and external destinations.
- All API calls use same-origin relative routes and the existing CSRF header.
- A stale request cannot replace data for newer URL criteria.
- No analytics service or non-essential script is activated.

## Honest content boundary

The properties and hotel brand are fictional. The application therefore does not publish invented contact details or claim real booking, payment, cancellation, or physical-accessibility services. Before a real launch, an operating business and qualified reviewer must approve those details. This boundary is visible to guests and recorded in the launch checklist.
