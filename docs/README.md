# Stillwater Hotels Documentation

Status: Foundation implemented; remaining features planned

Stillwater Hotels is a multi-property hotel reservation application built for the internship assignment. This documentation distinguishes assignment requirements, engineering safeguards, and optional enhancements.

The [root README](../README.md) describes the runnable foundation. Architecture and product documents describe the approved target; their planned features are not yet implemented.

## Reading path

1. [Requirements and scope](project/requirements-and-scope.md)
2. [Architecture overview](architecture/overview.md)
3. [Data model and reservation rules](architecture/data-model-and-reservations.md)
4. [API contract](architecture/api-contract.md)
5. [Brand and design system](design/brand-and-design-system.md)
6. [Quality and security strategy](quality/quality-and-security.md)
7. [Git and deployment workflow](operations/git-and-deployment.md)
8. [Architecture decisions](decisions/README.md)
9. [Independent review reconciliation](decisions/review-reconciliation.md)
10. [Implementation plan](plans/implementation-plan.md)

## Status vocabulary

- Planned: approved intent with no implementation evidence yet
- In progress: implementation has started but verification is incomplete
- Implemented: code exists and targeted checks pass locally
- Validated: complete verification has passed
- Released: the validated behavior is deployed and production smoke tests pass

No document may describe a feature as implemented until code and verification evidence exist.
