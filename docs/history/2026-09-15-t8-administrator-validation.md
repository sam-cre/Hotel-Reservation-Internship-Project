# T8 Administrator Application Validation

Date: September 15, 2026

Status: Complete local gate passed on `feature/administrator-application`; owner Git checkpoint pending

## Delivered behavior

- Protected `/admin` route with unauthenticated return and database-role-aware access handling
- Customer-role rejection before administrator APIs are called
- Shared Stillwater operations shell with reservation and hotel navigation
- Reservation register with server status filtering and local operational search
- Reservation details and permanent cancellation confirmation
- Hotel creation, editing, and historical-safe deactivation
- Room creation, editing, and historical-safe deactivation
- Typed numeric mutation values and strict documented payloads
- Pending-state duplicate submission prevention
- Server-error preservation for hotel, room, inventory-conflict, and reservation mutations
- Loading, empty, failure, success, and live announcement behavior
- Horizontally safe mobile reservation table with a pinned action column

## Focused component evidence

Command:

```powershell
npm --workspace frontend test -- admin
```

Result:

- 1 focused test file passed
- 5 focused administrator tests passed

The suite covers customer-role exclusion, administrator reservation retrieval, cancellation confirmation, visible reservation conflicts, typed hotel submission, duplicate submission prevention, and preservation of rejected room inventory edits.

## Browser evidence

Command:

```powershell
npm run test:e2e -- admin-journey
```

Result:

- 3 Chromium journeys passed
- The full reservation, hotel, and room management journey passed
- Customer-role blocking occurred before any administrator data request
- Axe reported zero violations on the 320px reservation workspace
- The 320px page had no horizontal overflow and retained the table action

## Complete T8 gate

Command:

```powershell
npm run verify:admin
```

Result:

- Formatting and ESLint passed.
- Backend: 14 test files passed, 2 conditional files skipped, 100 tests passed, and 5 PostgreSQL tests skipped locally.
- Frontend: 3 test files and 20 tests passed.
- The production frontend build passed.
- Environment, Git exclusions, frontend serving, administrator source delivery, and API proxy checks passed.
- npm reported zero known vulnerabilities.
- All 6 connected customer and administrator Chromium journeys passed.

The five locally skipped backend tests are PostgreSQL integration and synchronized concurrency checks. They passed against PostgreSQL 17 in the T6 pull-request workflow and remain part of the T8 pull-request workflow.

## Visual review

Desktop and 320px captures were inspected during implementation. The review corrected guest name and email spacing and confirmed:

- a stable operational hierarchy distinct from the guest journey
- approved Stillwater identity, typography, and Harbor Quiet tokens
- readable navigation and account context at desktop and mobile widths
- one deliberate brass register rule instead of decorative card effects
- visible reservation actions on narrow screens
- no page-level horizontal overflow

Temporary screenshots remain under the ignored `test-results/` directory and are not repository artifacts.

## Security and integrity review

- React checks the restored role before mounting administrator pages or requesting their data.
- Express remains authoritative and verifies the current database role for every mutation.
- The browser never submits user identity, role, hotel active state, room active state, or reservation ownership.
- Reservation status input is limited to the documented terminal cancellation.
- Deactivation preserves foreign-key references and historical reservations.
- Same-origin API calls retain the existing CSRF protection header and HTTP-only session cookie.
- No credentials, tokens, database URLs, or real guest records appear in tests or documentation.
