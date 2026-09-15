# Quality and Security Strategy

Status: T4 authentication controls implemented; later quality gates remain planned

## Quality gates

Every implementation phase must pass its own checks before the user creates a commit and pushes it.

The complete local verification command will run:

- Formatting check
- ESLint
- Backend unit tests
- Backend PostgreSQL integration tests
- Frontend component tests
- Production builds
- Critical Playwright journeys
- Accessibility assertions
- Secret scan
- Dependency audit review
- Metadata, internal-link, image-budget, and production-header checks from the launch-readiness checklist

## Test layers

### Unit tests

- Date-overlap predicate
- Night count
- Error mapping
- Status transitions
- Validation schemas
- Weather response mapping

### PostgreSQL integration tests

- Migrations apply to an empty test database
- Database constraints reject invalid rows
- Authentication queries never return password hashes
- Hotel and room CRUD obey authorization and deletion rules
- Public queries exclude deactivated hotels and room types while historical reservations still resolve them
- Search returns only qualifying hotels for complete stay criteria
- Availability counts multiple interchangeable units correctly
- Price is calculated from the locked database row
- Reservation ownership is enforced
- Two simultaneous requests for the last unit produce exactly one reservation
- Synchronized booking, cancellation, inventory-edit, and deactivation races preserve valid inventory
- Duplicate reservation submissions with one idempotency key create exactly one reservation
- Parallel requests do not leak open transactions or database clients

### Frontend tests

- Protected navigation
- Search query construction
- Loading, empty, error, and success states
- Reservation review uses server results
- Stale search responses cannot replace results for newer URL state
- Administrator controls remain unavailable to customers
- Form errors are associated with their fields

### End-to-end journeys

- Register, search, view a hotel, reserve, and view My Reservations
- Administrator login, create a hotel and room, view reservations, and update status
- Customer cannot access administrator APIs or interface routes
- Weather failure does not block hotel details

## Security controls

### Authentication

- Argon2id password hashing with OWASP baseline parameters
- Generic login failures
- Rate limits on login and registration
- Short-lived signed JWT with issuer and audience validation
- HTTP-only authentication cookie
- Secure cookie in production
- Current user and role loaded from PostgreSQL
- Public registration cannot select a role
- Administrator created by an explicit one-time seed command
- The administrator seed is idempotent and fails safely when required credentials are absent
- JWT logout is cookie deletion, not server-side token revocation; the short expiry bounds a copied token's remaining life

### Browser and API

- Same-origin `/api` proxy for the browser
- Exact allowed origins at Express
- Required custom CSRF header on state-changing requests
- Exact Origin validation for state-changing requests, with missing or foreign origins rejected in production
- Cross-site Fetch Metadata rejection; a missing header is accepted only when the required exact Origin and CSRF header pass
- JSON-only mutation bodies
- `SameSite=Lax` cookie
- Security headers appropriate to the frontend and API
- React output escaping remains enabled
- External URLs are validated before storage
- Authenticated responses use `Cache-Control: private, no-store`

### Database

- Parameterized SQL only
- Least-privilege application database credentials
- TLS connection to Neon
- Constraints repeat critical validation
- Transactions always release clients in `finally`
- Row locking protects inventory-changing operations
- Migrations are versioned and reviewed

### Secrets and logging

- `.env` and environment variants are ignored
- `.env.example` contains names and safe placeholders only
- Deployment secrets live in provider secret stores
- Logs redact cookies, authorization headers, passwords, JWTs, and database URLs
- Production errors omit stacks and SQL details
- No credentials appear in screenshots, documentation, fixtures, or seed data

## Security-audit schedule

1. Architecture threat-model review before implementation approval
2. Focused authentication review completed during T4; repeat after reservations are implemented
3. Full local audit before deployment
4. Production configuration review without penetration testing third-party infrastructure

Remote scanning is out of scope unless the user separately confirms authorization for a specific host and test plan.

Security working artifacts belong in `.security-audit/` and remain uncommitted because they may describe exploit paths or secret locations. The final public-safe security summary may be committed after review.

## Accessibility checklist

- Keyboard access to every action
- Visible focus
- Semantic headings and landmarks
- Form labels and associated errors
- Error meaning not dependent on color
- Status meaning not dependent on color
- Minimum 44px touch targets
- Responsive layout down to 320px
- Reduced-motion support
- Meaningful image alternative text
- Dialog focus management
- Automated axe checks plus manual keyboard review
- `aria-live` announcements for availability, price, booking success, and meaningful asynchronous failures

## Privacy and guest-information checks

- Essential storage is documented and contains no personal information.
- Non-essential scripts remain disabled until any required consent is recorded.
- Reject and accept choices have equal prominence, and preferences can be reopened from the footer.
- Privacy, reservation terms, accessibility, and contact pages are reachable and contain owner-reviewed content before release.
- Analytics remains out of scope unless the owner separately approves its purpose and consent behavior.

The complete adapted checklist is maintained in [Launch Readiness Checklist](launch-readiness-checklist.md).

## Verification integrity

Tests written by the implementation agent are not sufficient evidence by themselves. The plan adds:

- Requirement traceability
- Targeted independent peer review when a material uncertainty or risk warrants it
- Human review before commits
- Production smoke tests
- A final explanation walkthrough by the intern

## Continuous integration database

GitHub Actions runs the PostgreSQL integration suite against an ephemeral PostgreSQL service container. Local Docker is not required. Local integration tests use a dedicated test database with synthetic data, never the development or production database.

## Security references

- OWASP CSRF Prevention Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>
- OWASP Password Storage Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
