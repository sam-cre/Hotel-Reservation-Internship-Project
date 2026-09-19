# Stillwater Hotels

A full-stack hotel reservation platform built for the Modern Solutions B.V. internship assignment, developed using React, Node.js, Express, and PostgreSQL.

---

## Overview

Stillwater Hotels is a fictional boutique hospitality web application featuring active room availability, server-authoritative pricing, transaction-safe booking, guest account management, live destination weather, and a complete administrator management portal.

The application is deployed to production with a unified single-origin architecture: the frontend is hosted on Vercel and reverse-proxies `/api` traffic to the Express API on Railway, which connects to a managed PostgreSQL database on Neon.

- **Live Application**: <https://hotel-reservation-internship-projec-six.vercel.app>
- **API Health**: <https://hotel-reservation-internship-projec-six.vercel.app/api/health>
- **API Readiness**: <https://hotel-reservation-internship-projec-six.vercel.app/api/ready>

---

## Core Features

### Guest Experience

- **Hotel Search & Discovery**: Browse destination hotels by city, view high-resolution galleries, amenities, and starting rates.
- **Live Stay Availability**: Filter room inventory dynamically based on check-in/check-out dates and guest capacity.
- **Destination Weather**: View current temperature, wind speed, and weather condition badges for hotel destinations via Open-Meteo.
- **Secure Reservation Flow**: Transparent booking review with server-verified pricing and instant confirmation.
- **My Reservations**: View past and upcoming stays, inspect detailed booking folios, and sort reservations by arrival date, total price, or hotel name.
- **Guest Support & Compliance**: Substantive privacy, accessibility, and terms pages with persistent cookie consent controls.

### Administrator Portal

- **Role-Protected Access**: Dedicated operations area restricted to administrator accounts.
- **Reservation Register**: Search and filter all customer bookings across hotels, view payment/booking snapshots, and process cancellations.
- **Hotel Catalog Management**: Create and update hotel profiles, descriptions, amenities, address details, and cover images.
- **Room Inventory Management**: Configure room types, nightly base rates, and maximum guest capacities per hotel.

### Engineering & Security Highlights

- **Server-Authoritative Pricing**: The browser never submits booking prices or total calculations; rates and totals are computed strictly on the backend.
- **Concurrency & Idempotency**: Pessimistic row locking prevents double-booking race conditions during reservation creation. Client requests include UUID idempotency keys for safe retries.
- **Session Security**: Authentication is managed via secure, `httpOnly`, `SameSite=Lax` JWT cookies with Argon2id password hashing and brute-force rate limiting.
- **Resilient Weather Adapter**: Server-side caching, request coalescing, and circuit-breaker timeouts ensure third-party weather outages never block hotel bookings.

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router, Headless UI, Lucide Icons, CSS Modules
- **Backend**: Node.js, Express, `pg` (PostgreSQL client with connection pooling)
- **Database**: PostgreSQL with versioned SQL migrations and constraint enforcement
- **Security**: Argon2id, JSON Web Tokens (JWT), cookie-based sessions, CORS protection
- **Testing**: Vitest (backend and frontend unit/integration), Playwright (browser journey testing)
- **Tooling**: ESLint, Prettier, Gitleaks

---

## Project Structure

```text
├── backend/                  # Express REST API, auth, database migrations, and unit tests
│   ├── src/
│   │   ├── db/              # Pool configuration, migrations, seeds, and admin provisioning
│   │   ├── http/            # Error handling and validation middlewares
│   │   └── modules/         # Auth, catalog, reservations, and weather modules
│   └── test/                # Backend unit and integration test suites
├── frontend/                 # React single-page application (Vite)
│   ├── src/
│   │   ├── components/      # Reusable UI controls, buttons, fields, and dialogs
│   │   ├── features/        # Customer, admin, and design system modules
│   │   └── services/        # API client and session management
│   └── test/                # Frontend component and integration tests
├── tests/                    # Playwright end-to-end browser journeys (customer & admin)
├── scripts/                  # Verification, secret scanning, and foundation checks
└── docs/                     # Architecture, data model, API contract, and operations docs
```

---

## Local Development

### Prerequisites

- Node.js 24+ and npm 11+
- PostgreSQL database instance
- Git

### Quickstart

1. **Clone the repository**:

   ```powershell
   git clone https://github.com/sam-cre/Hotel-Reservation-Internship-Project.git
   cd "Hotel-Reservation-Internship-Project"
   ```

2. **Install dependencies**:

   ```powershell
   npm ci
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your PostgreSQL connection string and JWT secret:

   ```powershell
   Copy-Item .env.example .env
   ```

4. **Run migrations and seed data**:

   ```powershell
   npm run db:migrate --workspace backend
   npm run db:seed --workspace backend
   ```

5. **Start development servers**:
   ```powershell
   npm run dev
   ```
   - Frontend: <http://127.0.0.1:5173>
   - Backend API: <http://127.0.0.1:3001>
   - API via Frontend Proxy: <http://127.0.0.1:5173/api/health>

---

## Testing & Quality Assurance

The repository includes a comprehensive verification pipeline covering formatting, linting, 205 automated unit and integration tests, security audit, and Playwright browser journeys.

Run the complete local verification suite:

```powershell
npm run verify:local
```

### Individual Test Suites

- **Unit & Integration Tests**: `npm test`
- **Backend Tests**: `npm run test --workspace backend`
- **Frontend Tests**: `npm run test --workspace frontend`
- **End-to-End Journeys**: `npm run test:e2e`
- **Code Formatting**: `npm run format:check` (or `npm run format` to apply)
- **Code Linting**: `npm run lint`

---

## Deployment Architecture

- **Frontend**: Hosted on Vercel with automatic rewrites routing `/api/*` to the backend service.
- **Backend API**: Hosted on Railway running Node.js in production mode.
- **Database**: PostgreSQL hosted on Neon with SSL enforcement and connection pooling.

For complete architectural details, see the [Architecture Overview](docs/architecture/overview.md), [API Contract](docs/architecture/api-contract.md), and [Data Model & Reservations Specification](docs/architecture/data-model-and-reservations.md).
