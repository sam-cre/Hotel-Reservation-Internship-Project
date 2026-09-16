# Database Operations

Status: T3 database foundation, T6 reservation-total migration, and the T11 hotel-amenities migration implemented

PostgreSQL stores users, hotels, room types, and reservations. Application code uses the `pg` driver. Versioned SQL files remain the authoritative schema history.

## Configuration

| Variable            | Required              | Purpose                                                               |
| ------------------- | --------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`      | Database commands     | PostgreSQL connection URL                                             |
| `DATABASE_SSL`      | No                    | `require` by default; use `disable` only for a trusted local server   |
| `DATABASE_POOL_MAX` | No                    | Maximum open connections; defaults to 5 and is limited to 20          |
| `TEST_DATABASE_URL` | Real-server tests     | Dedicated disposable database whose name contains `test`              |
| `ADMIN_NAME`        | Administrator command | Initial administrator display name                                    |
| `ADMIN_EMAIL`       | Administrator command | Initial administrator email, normalized to lowercase                  |
| `ADMIN_PASSWORD`    | Administrator command | Initial administrator password, supplied only through the environment |

Never reuse development or production databases for tests. The real-server test requires `NODE_ENV=test`, accepts only database names with a `test_` prefix or `_test` suffix, and clears its tables.

## Create a local database

When PostgreSQL is installed locally, create separate development and test databases using an administrator account:

```powershell
createdb stillwater_dev
createdb stillwater_test
```

Copy `.env.example` to the ignored `.env` file and adjust connection URLs for the local PostgreSQL account. Do not commit `.env`.

## Apply migrations

```powershell
npm run db:migrate --workspace backend
```

Migration `002_expand_reservation_total.sql` widens reservation totals to `numeric(18,2)`. This preserves exact decimal arithmetic for longer stays without changing the room nightly-price type.

Migration `003_add_hotel_amenities.sql` adds an `amenities text[]` column to `hotels`, defaulting to an empty array, with check constraints that cap the list at 12 entries and reject empty-string entries. Per-entry length is enforced by the application schema.

The migration runner:

- Acquires a PostgreSQL advisory lock so two deployments cannot migrate simultaneously.
- Creates `schema_migrations` to record version, filename, checksum, and application time.
- Applies each pending migration inside its own transaction.
- Rejects a migration file if its recorded checksum no longer matches.
- Releases the database client and advisory lock after success or failure.

Never edit a migration that has been applied. Add the next numbered migration instead.

## Load development data

Run migrations first, then:

```powershell
npm run db:seed --workspace backend
```

The development seed contains fictional hotels and room types. It can be run repeatedly without creating duplicates. The command refuses to run when `NODE_ENV=production`.

## Provision an administrator

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the current shell or an ignored local `.env`, then run:

```powershell
npm run db:provision-admin --workspace backend
```

The command hashes the password with Argon2id before storage. Repeating it for an existing administrator updates that administrator. It refuses to convert an existing customer account into an administrator.

## Verification

The portable local suite uses PGlite, PostgreSQL compiled for an isolated test process:

```powershell
npm run test:database
```

When a normal PostgreSQL test server is available, set `TEST_DATABASE_URL` and run the same command. The additional integration test applies migrations with the production `pg` driver, repeats them to verify idempotency, loads the seed twice, checks resulting counts, and clears the disposable schema.

The complete T3 gate is:

```powershell
npm run verify:database
```

## Recovery

- A failed migration transaction is rolled back and is not recorded.
- Fix an unapplied migration and rerun the command.
- If a migration was already applied, create a new numbered migration to correct it.
- Do not manually change `schema_migrations` or bypass a checksum mismatch.
- Restore production data from the database provider's backup workflow. Development seeds are not backups.
