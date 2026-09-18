# Stillwater Hotels Documentation

Stillwater Hotels is a multi-property hotel reservation application: a React frontend, an Express API, and PostgreSQL, deployed to production on Vercel, Railway, and Neon. This documentation is organized by area so any reader can find a subject quickly.

The [root README](../README.md) covers running the application and the live deployment. Start here for how the system is built and why.

## Architecture

System-wide design, contracts, and data rules.

- [Overview](architecture/overview.md): components, boundaries, and request flow
- [API contract](architecture/api-contract.md): every endpoint, its shape, and its rules
- [Data model and reservation rules](architecture/data-model-and-reservations.md): schema, price snapshots, and the availability lock

## Features

One guide per product capability, each covering behavior, boundaries, and limitations.

- [Authentication](features/authentication.md)
- [Catalog](features/catalog.md): hotels, rooms, search, and availability
- [Reservations](features/reservations.md)
- [Customer application](features/customer-application.md)
- [Administrator application](features/administrator-application.md)
- [Weather](features/weather.md): the backend-integrated external service

## Design

- [Brand and design system](design/brand-and-design-system.md): identity, tokens, typography, and layout
- [Asset credits](design/asset-credits.md): image provenance, optimization, and licenses

## Operations

Running, shipping, and maintaining the system.

- [Database operations](operations/database.md): configuration, migrations, safety, and recovery
- [Production deployment](operations/production-deployment.md): the deployment runbook and post-launch checks
- [Git and deployment workflow](operations/git-and-deployment.md): branching, verification, and release flow

## Project

- [Requirements and scope](project/requirements-and-scope.md): assignment requirements and engineering safeguards
- [Assignment traceability](project/assignment-traceability.md): requirement-to-code-to-test matrix
- [Explanation readiness](project/explanation-readiness.md): concise walkthrough of each feature

## Quality

- [Quality and security](quality/quality-and-security.md): testing strategy and the security safeguard set
- [Launch readiness checklist](quality/launch-readiness-checklist.md): evidence-backed release status
