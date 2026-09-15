# T3 Database Validation Record

Status: Locally validated

Date: September 15, 2026

## Assignment traceability

The controlling assignment requires PostgreSQL tables for users, hotels, rooms, and reservations. Migration `001_initial_schema.sql` implements all listed fields. The approved engineering plan adds only the safeguards required for reliable booking history and concurrent inventory work: active flags, immutable price snapshots, idempotency metadata, constraints, and query indexes.

## Delivered

- Bounded PostgreSQL connection pool with explicit TLS configuration
- Client-release and transaction helpers
- Ordered migration discovery with SHA-256 checksums
- Transactional migration runner protected by an advisory lock
- Initial users, hotels, rooms, and reservations schema
- Named constraints and indexes for planned query paths
- Deterministic, idempotent fictional development seed
- Argon2id administrator provisioning that refuses customer-role escalation
- Safe environment validation that does not echo rejected credentials
- Portable PGlite schema tests and an optional normal PostgreSQL integration test
- Database setup, operation, recovery, and verification documentation

## Verification

`npm run verify:database` passed with:

- Formatting and ESLint
- 33 backend tests passed
- 10 frontend regression tests passed
- Frontend production build
- Environment and Git exclusion checks
- Frontend-to-API proxy verification
- Dependency audit with no known vulnerabilities

Of the backend tests, 22 directly validate database configuration, client cleanup, transaction behavior, migration discovery, migration idempotency, checksum protection, schema constraints, query indexes, seed idempotency, production seed refusal, and administrator provisioning.

## Environment boundary

No normal PostgreSQL server is installed on the development machine. The local database suite uses PGlite, PostgreSQL compiled for an isolated test process. One additional production-driver integration test is intentionally skipped unless `TEST_DATABASE_URL` points to a disposable database whose name contains `test`. The later CI phase must run that test against a normal PostgreSQL service before release.

## Deferred by design

T3 does not add authentication routes, hotel APIs, room APIs, availability queries, or reservation transactions. Those remain T4 through T6 work and will consume this schema through parameterized SQL.
