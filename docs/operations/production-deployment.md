# Production Deployment Runbook

Status: Active for T11. Stack is Railway (API) plus Neon (PostgreSQL) plus Vercel (frontend).

This runbook is the step-by-step procedure for taking Stillwater Hotels live. It is written so the owner can follow it directly. Secrets are always entered into a provider's own settings panel and never pasted into chat, a commit, or a log.

## Architecture

```text
Browser
  -> Vercel (serves the built SPA, and rewrites /api/* to the Railway API)
       -> Railway (Express API)
            -> Neon (PostgreSQL)
```

The frontend and the API are served under one public origin: the Vercel domain. Vercel serves the static site, and for any request that starts with `/api/`, Vercel forwards it server-side to the Railway API. This is a "reverse proxy" (one server passing a request through to another and returning its response).

Why the proxy matters, in plain terms:

- The authentication session lives in an HttpOnly cookie with `SameSite=Lax`. A cookie like that is only sent back on requests to the same site that set it. Because the browser only ever talks to the Vercel domain, the cookie is first-party and always travels with API calls.
- The API's cross-site request defenses check the `Origin` header. The browser sends `Origin: https://<vercel-domain>`, Vercel forwards it, and the API allows exactly that origin. So the browser side and the API side agree on one origin with no cross-origin exceptions to weaken.

The trade-off is that the Railway public URL is baked into `vercel.json`, so that file is finalized only after Railway is live and its URL is known.

## What is already done

- Neon project `stillwater-hotels` exists in AWS us-east-2, database `neondb`, connection pooling on.
- All three migrations are applied, sample data is seeded, and the administrator account is provisioned. These were run once from the local machine against Neon, so the first Railway deploy does not need to run them again.

## Environment variables (Railway API service)

Set these in the Railway service under Variables. Values marked "secret" are entered directly in Railway and never appear in the repository.

| Variable           | Value                               | Notes                                                                                                                                    |
| ------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `production`                        | Turns on secure cookies and the HTTPS-origin requirement.                                                                                |
| `HOST`             | `0.0.0.0`                           | Required so Railway can route external traffic to the process. The local default `127.0.0.1` would only accept in-container connections. |
| `TRUST_PROXY_HOPS` | `1`                                 | Railway terminates TLS at its edge and forwards one hop. This lets Express read the real client protocol and address.                    |
| `DATABASE_URL`     | Neon pooled string (secret)         | Use the pooled connection string. Remove the trailing `&channel_binding=require`; keep `?sslmode=require`.                               |
| `DATABASE_SSL`     | `require`                           | This is the default, set it explicitly for clarity. The pool validates Neon's certificate.                                               |
| `JWT_SECRET`       | 32+ random characters (secret)      | Generate fresh, do not reuse the local development secret. See the generation command below.                                             |
| `ALLOWED_ORIGINS`  | `https://<your-project>.vercel.app` | Exactly one origin, scheme and host only, no trailing slash and no path. Must be HTTPS in production.                                    |

Do not set `PORT`. Railway injects it automatically and the server already reads it.

`ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are only used by the one-time provisioning script, which already ran against Neon. The running API does not read them, so they are not set on Railway.

Optional variables, left unset unless needed:

- `CATALOG_IMAGE_HOST_ALLOWLIST`: empty by default. Seeded hotel images are same-origin (`/images/...`). Set this only if an administrator needs to point a hotel image at a specific external HTTPS host, listed as a comma-separated allowlist.
- `WEATHER_*`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_TTL_MINUTES`, `AUTH_COOKIE_NAME`, `DATABASE_POOL_MAX`, `AUTH_RATE_LIMIT_*`: all have safe defaults.

Generate a JWT secret locally and paste it straight into the Railway variable (not into chat):

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

## Deployment order

The order avoids a chicken-and-egg problem: Railway needs the Vercel origin, and Vercel needs the Railway URL. Creating the Vercel project first reserves its domain, which is all Railway needs.

### Step 1: Create the Vercel project (reserve the domain)

1. In Vercel, import the GitHub repository.
2. Leave Root Directory empty (the repository root). Vercel reads `vercel.json`, which already sets the install command, build command, and output directory.
3. Deploy. This first build succeeds and serves the static site. The `/api/*` proxy will not work yet because `vercel.json` still holds a placeholder Railway URL, which is expected at this point.
4. Note the assigned domain, for example `https://stillwater-hotels.vercel.app`. This is the value for `ALLOWED_ORIGINS`.

### Step 2: Deploy the Railway API

1. In Railway, create a service from the same GitHub repository, branch `main`.
2. Service settings:
   - Root Directory: repository root (leave blank).
   - Install Command: `npm ci`
   - Build Command: leave blank (the API needs no build step; the root `build` script builds the frontend and should not run here).
   - Start Command: `npm start --workspace backend`
   - Health Check Path: `/api/health`
3. Add every variable from the table above, using the Vercel domain from Step 1 for `ALLOWED_ORIGINS`.
4. Deploy. When the service is healthy, copy its public URL, for example `https://stillwater-api-production.up.railway.app`.

### Step 3: Finalize and ship the proxy configuration

This is a small pull request on a branch, following the usual stop-before-merge checkpoint.

1. In `vercel.json`, replace `REPLACE_WITH_RAILWAY_PUBLIC_URL` with the Railway host from Step 2 (host only, no scheme in the placeholder position is already handled; the line reads `https://<railway-host>/api/:path*`).
2. In `frontend/public/robots.txt` and `frontend/public/sitemap.xml`, replace `REPLACE_WITH_VERCEL_DOMAIN` with the Vercel domain from Step 1.
3. Run `npm run verify:local`.
4. Push, open the pull request, wait for green CI, then merge.
5. Merging to `main` triggers a Vercel redeploy. The `/api/*` proxy is now live.

### Step 4: Verify against the public URLs

Confirm each item against the live Vercel domain:

- `GET https://<vercel-domain>/api/health` returns `{"status":"ok"}`.
- `GET https://<vercel-domain>/api/ready` returns `{"status":"ready"}` (this proves the API reached Neon).
- The customer journey works end to end: search, open a hotel, register or sign in, review, confirm a reservation, and view it in reservation history.
- The administrator journey works: sign in as the provisioned administrator, view the reservation register, and manage hotels and rooms.
- On a login response, the `Set-Cookie` header keeps `HttpOnly`, `Secure`, and `SameSite=Lax` after passing through the Vercel proxy.
- Authenticated and mutation responses carry `Cache-Control: no-store`.
- Loading `/admin` or `/reservations` while signed out redirects to sign-in rather than exposing data.
- `https://<vercel-domain>/robots.txt` and `/sitemap.xml` load and contain the real domain.

### Step 5: Record the URLs

Add the public frontend URL, the API health and readiness URLs, and a short "how to run locally" pointer to the top-level `README.md`.

## Operations after launch

- Future schema changes: after a migration file is added and merged, apply it to Neon by running `npm run db:migrate --workspace backend` from a machine whose `DATABASE_URL` points at Neon, or through a Railway one-off command with the same variable. Migrations are idempotent; a no-op run reports `Applied: 0`.
- Rolling back the frontend: redeploy a previous successful build from the Vercel dashboard.
- Rolling back the API: redeploy a previous successful deployment from the Railway dashboard. Roll a migration back only with a reviewed down-migration, since Neon holds live data.
- Railway keeps the paid service warm, so there is no free-tier cold-start delay to design around.

## Platform references

- Vercel configuration (`vercel.json`): <https://vercel.com/docs/projects/project-configuration>
- Vercel rewrites: <https://vercel.com/docs/routing/rewrites>
- Railway variables and start command: <https://docs.railway.com/guides/variables>
- Neon connection strings and pooling: <https://neon.com/docs/connect/connection-pooling>
