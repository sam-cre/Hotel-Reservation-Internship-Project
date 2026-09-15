# Stillwater Hotels Documentation

Status: T1 through T5 merged; T6 portable gate passed and PostgreSQL pull-request gate pending

Stillwater Hotels is a multi-property hotel reservation application built for the internship assignment. This documentation distinguishes assignment requirements, engineering safeguards, and optional enhancements.

Start with the [engineering handoff](HANDOFF.md) for current status and safe commands. The [root README](../README.md) describes the runnable foundation and sample design previews. PostgreSQL infrastructure, backend authentication, catalog APIs, and reservation APIs are implemented. Connected frontend and weather behavior remain planned.

## Reading path

1. [Engineering handoff](HANDOFF.md)
2. [Requirements and scope](project/requirements-and-scope.md)
3. [Architecture overview](architecture/overview.md)
4. [Data model and reservation rules](architecture/data-model-and-reservations.md)
5. [API contract](architecture/api-contract.md)
6. [Brand and design system](design/brand-and-design-system.md)
7. [Quality and security strategy](quality/quality-and-security.md)
8. [Launch readiness checklist](quality/launch-readiness-checklist.md)
9. [Git and deployment workflow](operations/git-and-deployment.md)
10. [Database operations](operations/database.md)
11. [Authentication operations](operations/authentication.md)
12. [Catalog operations](operations/catalog.md)
13. [Reservation operations](operations/reservations.md)
14. [Architecture decisions](decisions/README.md)
15. [T2 design review reconciliation](decisions/t2-design-review.md)
16. [Implementation plan](plans/implementation-plan.md)

## Validation history

- [T2 design validation](history/2026-09-15-t2-design-validation.md)
- [T3 database validation](history/2026-09-15-t3-database-validation.md)
- [T4 authentication validation](history/2026-09-15-t4-authentication-validation.md)
- [T5 catalog validation](history/2026-09-15-t5-catalog-validation.md)
- [T6 reservation validation](history/2026-09-15-t6-reservation-validation.md)

## Status vocabulary

- Planned: approved intent with no implementation evidence yet
- In progress: implementation has started but verification is incomplete
- Implemented: code exists and targeted checks pass locally
- Validated: complete verification has passed
- Released: the validated behavior is deployed and production smoke tests pass

No document may describe a feature as implemented until code and verification evidence exist.
