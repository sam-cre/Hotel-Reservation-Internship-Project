# T4 Authentication Validation

Date: September 15, 2026

Status: Locally validated on `feature/authentication`

## Delivered behavior

- Strict customer registration and login schemas
- Argon2id password hashing and dummy verification for unknown accounts
- Short-lived JWT signing and verification with fixed algorithm, issuer, audience, and expiration
- HttpOnly cookie sessions with production-only Secure behavior
- Logout cookie expiration and current-user restoration
- Exact-origin, custom-header, Fetch Metadata, and JSON mutation checks
- Registration, IP, and normalized-identity rate limits
- Reusable authentication and administrator-authorization middleware
- Current role loading from PostgreSQL on each protected request
- Shared safe HTTP errors and browser client cookie support

## Focused evidence

Command:

```powershell
npm --workspace backend test -- authentication authorization
```

Result:

- 2 test files passed
- 22 tests passed
- No failed or skipped focused test

## Complete gate

Command:

```powershell
npm run verify:authentication
```

- Formatting and ESLint passed.
- Backend: 7 test files passed, 1 conditional file skipped, 58 tests passed, and 1 conditional test skipped.
- Frontend: 1 test file and 10 tests passed.
- The production frontend build passed.
- Environment, Git exclusions, frontend serving, and API proxy checks passed.
- npm reported zero known vulnerabilities.

The skipped test is the normal PostgreSQL driver test. It activates when `TEST_DATABASE_URL` points to a disposable PostgreSQL test database.

## Security review

- Local dependency audit reported no known vulnerability.
- Bounded Git-history review found no live secret or committed sensitive file.
- Authentication threat modeling and adversarial review produced regression cases for every T4 boundary.
- No remote host, GitHub service, deployed API, or third-party system was probed.

## Known limitation

Logout deletes the browser cookie but cannot revoke a copied stateless JWT before its short expiration. Refresh tokens, password reset, email verification, MFA, and shared distributed rate-limit storage are outside the approved assignment scope.
