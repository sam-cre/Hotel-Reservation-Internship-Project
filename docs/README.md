# Stillwater Hotels Documentation

Status: T1 committed; T2 validated and approved; T3 is next

Stillwater Hotels is a multi-property hotel reservation application built for the internship assignment. This documentation distinguishes assignment requirements, engineering safeguards, and optional enhancements.

Start with the [engineering handoff](HANDOFF.md) for current status and safe commands. The [root README](../README.md) describes the runnable foundation and sample design previews. Architecture and product documents describe the approved target; the database, authentication, and real booking features are not yet implemented.

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
10. [Architecture decisions](decisions/README.md)
11. [T2 design review reconciliation](decisions/t2-design-review.md)
12. [Implementation plan](plans/implementation-plan.md)

## Status vocabulary

- Planned: approved intent with no implementation evidence yet
- In progress: implementation has started but verification is incomplete
- Implemented: code exists and targeted checks pass locally
- Validated: complete verification has passed
- Released: the validated behavior is deployed and production smoke tests pass

No document may describe a feature as implemented until code and verification evidence exist.
