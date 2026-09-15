# Git and Deployment Workflow

Status: Planning

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

GitHub Actions runs formatting, linting, builds, and tests on pull requests and `main`. PostgreSQL integration tests use an ephemeral service container in CI. Docker remains optional for local development because it is not required by the assignment and is not currently installed on the development machine.

## Platform references

- Vercel proxied-request limits: <https://vercel.com/docs/limits>
- Vercel external rewrites: <https://vercel.com/docs/routing/rewrites>
- Render free-instance behavior: <https://render.com/docs/free>
- Neon plans: <https://neon.com/pricing>
