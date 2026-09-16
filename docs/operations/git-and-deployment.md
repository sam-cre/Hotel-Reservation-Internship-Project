# Git and Deployment Workflow

Status: Git workflow and continuous integration active; deployment planned for T11

## Ownership

The user is the only person who runs:

- `git add`
- `git commit`
- `git push`
- Pull-request creation
- Pull-request merge
- Release tagging

The coding agent may run read-only commands such as `git status`, `git diff`, `git log`, and `git check-ignore`.

## Local-only material

`.git/info/exclude` keeps these local without adding repository-visible ignore rules:

- Assignment PDF
- Root `AGENTS.md`
- `local-workspace/`

`local-workspace/` contains personal command sheets, peer-review material, temporary planning notes, and local execution instructions. It never contains credentials.

## Committed ignore policy

`.gitignore` will cover:

- Dependencies
- Build output
- Coverage and test artifacts
- Logs
- `.env` and environment-specific variants
- Private key and certificate formats
- Local deployment metadata
- Editor and operating-system files
- `.security-audit/`

`.env.example` remains explicitly allowed and contains placeholders only.

## Commit checkpoint protocol

For every checkpoint:

1. The agent reports changed files and verification results.
2. The agent proposes one coherent commit message.
3. The user reviews `git status` and the complete diff.
4. The user stages explicit paths, not an automatic blanket selection.
5. The user reviews the staged diff.
6. Secret scanning runs against the working tree and Git history.
7. The user commits and pushes with provided PowerShell commands.

Commit messages describe delivered behavior. Comments in code never describe review rounds or historical fixes.

## Branch strategy

- `main` remains deployable.
- Each significant feature uses a short-lived branch.
- Small documentation corrections may use `main` only when the user explicitly chooses that workflow.
- Pull requests are used for meaningful feature branches, even when the user is the sole author, because they create a reviewable record.
- Branches are merged only after checks pass.

Suggested branch sequence:

```text
docs/planning-foundation
feature/project-foundation
feature/database
feature/authentication
feature/hotel-room-api
feature/reservations
feature/customer-ui
feature/admin-ui
feature/weather
chore/hardening-deployment
```

## Deployment selection

- Frontend: Vercel
- API: Render free web service
- Database: Neon free PostgreSQL
- External API: Open-Meteo

Render is selected because the assignment recommends it and it currently provides a free Node.js web service. The free service sleeps after inactivity, so the UI must handle a cold start gracefully. Neon is used instead of Render PostgreSQL because Render's free PostgreSQL expires after 30 days, while Neon provides an ongoing free plan and pooled connections.

## Deployment order

1. Local application and tests pass.
2. Neon project is created and migrations are applied.
3. Render API is deployed with a health check and secrets.
4. The public Render API URL is tested directly.
5. Vercel frontend is deployed with the API rewrite destination configured.
6. Cookie, origin, cache, and HTTPS behavior are verified in production.
7. The Vercel rewrite is verified to preserve every authentication `Set-Cookie` attribute.
8. Complete customer and administrator smoke tests run against public URLs.
9. URLs and setup instructions are added to the README.

## Production configuration

- Node.js 24 LTS
- Explicit frontend and API origins
- Pooled Neon connection string
- Strong JWT signing secret
- Secure cookies
- Production logging with secret redaction
- No debug stack traces
- `Cache-Control: private, no-store` for authenticated responses
- No caching for mutation responses
- Health checks contain no sensitive data
- Render filesystem is treated as ephemeral

## Cold-start experience

The first API request after Render has been idle may be slow. Current Vercel limits allow an external rewrite request up to 120 seconds, so the proxy is not expected to fail before a normal Render free-tier wake-up completes. The frontend shows a clear loading state. It may offer one user-triggered retry for safe reads, but it never automatically retries a reservation mutation without its idempotency key. Documentation explains the free-tier limitation honestly.

## Continuous integration

The `.github/workflows/verification.yml` workflow runs on pull requests targeting `main`. It has no separate `push` trigger: `main` advances only through a pull request whose checks pass, so the pull-request run already gates every change that reaches `main`. The workflow declares `contents: read` permissions, cancels superseded runs for the same ref through a concurrency group, and pins every action to an exact commit SHA.

Each run checks out the repository with `persist-credentials: false` and full history, runs a pinned Gitleaks secret scan, installs locked dependencies with `npm ci`, installs Chromium, and runs the canonical `npm run verify:local` gate. That gate covers formatting, linting, backend and frontend tests, the production build, foundation and secret-scan configuration checks, the dependency audit, and the Playwright journeys. PostgreSQL integration and concurrency tests run against an ephemeral `postgres:17-alpine` service container using synthetic test-only credentials; those specific tests are skipped locally when `TEST_DATABASE_URL` is absent. Docker remains optional for local development because it is not required by the assignment and is not currently installed on the development machine.

### Secret scanning

- The pull-request gate runs `gitleaks/gitleaks-action` pinned to commit `e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e` (v3.0.0). The step is given the workflow's automatic `GITHUB_TOKEN` through `env`, which the action requires to read a pull request's commits; the workflow grants `contents: read` and `pull-requests: read` for this. No `GITLEAKS_LICENSE` is required because the repository belongs to a personal account; a license would be required only if the repository moved under a GitHub organization.
- `.gitleaks.toml` extends the maintained default ruleset, adds a canary rule, and narrowly allowlists `.env.example`, the config file itself, and the synthetic `test-only-password` used by disposable test databases.
- `scripts/verify-foundation.js` runs in every gate and asserts, without any scanner binary, that CI pins the verified action commit, that no `.env` variant, private key, or certificate is tracked, and that the canary rule matches its sentinel token but not benign text. This proves the ruleset is active rather than silently empty.
- Owner-side history scan (optional, requires the Gitleaks binary installed locally):

```powershell
gitleaks detect --source . --config .gitleaks.toml --redact
```

## Platform references

- Vercel proxied-request limits: <https://vercel.com/docs/limits>
- Vercel external rewrites: <https://vercel.com/docs/routing/rewrites>
- Render free-instance behavior: <https://render.com/docs/free>
- Neon plans: <https://neon.com/pricing>
