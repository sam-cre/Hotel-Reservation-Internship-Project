# T10 Local Hardening and Security Audit Validation

Date: September 16, 2026

Status: Complete local gate passed on `feature/local-hardening`; owner Git checkpoint pending

## Scope

T10 is an authorized defensive review and hardening of the owner's own repository. All security proofs used local mocks, direct function calls, or source inspection. No external, production, staging, GitHub, cloud, or provider target was contacted. `npm audit` reported zero advisories, and a bounded redacted history scan found no real credential; the two credentialed strings in history were synthetic localhost test values.

## Findings and outcomes

| ID      | Title                                                   | Severity | Outcome                           |
| ------- | ------------------------------------------------------- | -------- | --------------------------------- |
| SEC-100 | Bound unauthenticated weather work and cache state      | Medium   | Fully mitigated                   |
| SEC-200 | Reject backslash-based external post-login destinations | Medium   | Fully mitigated                   |
| SEC-201 | Restrict catalog image URLs to approved origins         | Low      | Fully mitigated                   |
| SEC-300 | Registration account enumeration                        | Low      | Accepted risk, behavior unchanged |
| SEC-400 | Add deterministic secret scanning                       | Low      | Fully mitigated                   |

### SEC-100

Added a shared concurrency limit for distinct-city lookups, a size-bounded success cache with first-in eviction and expiry cleanup, and a per-client route rate limiter before any provider work. Same-key coalescing, provider deadlines, schemas, and safe errors are preserved. New configuration: `WEATHER_MAX_IN_FLIGHT`, `WEATHER_MAX_CACHE_ENTRIES`, `WEATHER_RATE_LIMIT_WINDOW_MS`, `WEATHER_RATE_LIMIT_MAX`. Files: `backend/src/config/weather.js`, `backend/src/modules/weather/service.js`, `backend/src/modules/weather/routes.js`, tests in `backend/test/weather/weather.test.js`.

### SEC-200

`safeReturnTo` now rejects backslashes and control characters, resolves the candidate against the application origin, requires the parsed origin to match, and returns only the local pathname, search, and hash. Files: `frontend/src/features/customer/customer-utils.js`, tests in `frontend/test/customer-utils.test.js`.

### SEC-201

Hotel image URLs are validated through `createHotelMutationSchema(allowlist)`. Same-origin `/images/...` paths remain valid; a remote image is accepted only when it is HTTPS, has no embedded credentials, and its host is on the server-configured allowlist, which is empty by default. New configuration: `CATALOG_IMAGE_HOST_ALLOWLIST` via `backend/src/config/catalog.js`, threaded through `backend/src/app.js` and `backend/src/modules/catalog/routes.js`. Tests in `backend/test/catalog/image-url.test.js`.

### SEC-300

Registration returns HTTP 409 with `EMAIL_ALREADY_REGISTERED` for an existing email. An indistinguishable registration response depends on email verification, which is out of scope. Registration rate limiting, generic login failures, and Argon2id hashing constrain follow-on abuse. The risk is accepted for this assignment and recorded in [quality and security](../quality/quality-and-security.md). Behavior is unchanged.

### SEC-400

The pull-request workflow runs `gitleaks/gitleaks-action` pinned to commit `e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e` (v3.0.0). No license is required for this personal-account repository. `.gitleaks.toml` extends the default ruleset, adds a sentinel canary rule, and narrowly allowlists `.env.example`, the config file, and the synthetic `test-only-password`. `scripts/verify-foundation.js` asserts the pinned action, that no `.env` variant, key, or certificate is tracked, and that the canary rule matches its sentinel token but not benign text, proving the ruleset is active without needing the scanner binary. The workflow was also hardened with `persist-credentials: false`, full-history checkout, a concurrency group, and Node 24-native action pins (`actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` v7.0.1, `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` v7.0.0), and now runs `npm run verify:local`.

## Verification

Command:

```powershell
npm run verify:local
```

Results:

- Formatting and ESLint passed with zero warnings.
- Backend: 16 test files passed, 2 conditional files skipped, 119 tests passed, and 5 PostgreSQL tests skipped locally.
- Frontend: 4 test files and 37 tests passed.
- The production frontend build passed.
- Environment, Git exclusion, secret-scan configuration and canary, frontend serving, and API proxy checks passed.
- npm reported zero known vulnerabilities.
- All 6 connected customer and administrator Chromium journeys passed.

The 5 locally skipped backend tests are the PostgreSQL integration and synchronized concurrency checks in `backend/test/database/postgres-integration.test.js` and `backend/test/reservations/postgres-concurrency.test.js`. They run in the pull-request workflow against an ephemeral PostgreSQL 17 service. They were not run locally in this session because `TEST_DATABASE_URL` was not set, and this record does not claim they passed locally.

Local security proofs (mocks and direct functions only, no external request):

```powershell
node .security-audit/security-tests/test_sec100_poc.js
node .security-audit/security-tests/test_sec200_poc.js
node .security-audit/security-tests/test_sec201_poc.js
node .security-audit/security-tests/test_sec300_poc.js
node .security-audit/security-tests/test_sec400_poc.js
```

Results: SEC-100, SEC-200, SEC-201, and SEC-400 report Fully Mitigated. SEC-300 reports Confirmed Exploitable by design, because its behavior is an accepted risk and was intentionally not changed.

## Files changed

- Application: `frontend/src/features/customer/customer-utils.js`, `backend/src/modules/catalog/validation.js`, `backend/src/config/catalog.js`, `backend/src/modules/catalog/routes.js`, `backend/src/app.js`, `backend/src/server.js`, `backend/src/config/weather.js`, `backend/src/modules/weather/service.js`, `backend/src/modules/weather/routes.js`.
- Tests: `frontend/test/customer-utils.test.js`, `backend/test/catalog/image-url.test.js`, `backend/test/catalog/helpers.js`, `backend/test/weather/weather.test.js`.
- Gate and CI: `.github/workflows/verification.yml`, `.gitleaks.toml`, `scripts/verify-foundation.js`, `package.json`, `.env.example`.
- Documentation: this record and the documents it links.

Security working artifacts under `.security-audit/` remain uncommitted by design.

## Post-merge correction

The T10 pull request (number 11, merge commit `3445740`) was merged while its Verification run was red, and two continuous-integration-only defects were then corrected in follow-up pull requests. The local `npm run verify:local` evidence recorded above was accurate throughout; only the continuous integration configuration needed these changes.

1. Pull request 12 added `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` to the `gitleaks-action` step and granted `pull-requests: read`. The action requires that token to read a pull request's commits, and without it the step failed before the rest of the gate ran.

2. With the scan then running, `gitleaks-action` writes a `results.sarif` report into the workspace, which `prettier --check .` flagged as unformatted. A further change ignores `*.sarif` in `.prettierignore`, `.gitignore`, and the ESLint configuration, so the generated report no longer breaks the gate. This was reproduced locally by placing a `results.sarif` file in the working tree and confirming `npm run verify:local` passes.
