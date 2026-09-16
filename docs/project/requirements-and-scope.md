# Requirements and Scope

Status: Assignment features A01 through A18, A20, and the S01 through S15 safeguards implemented and locally validated through T10; A19 deployment and A21 explanation demonstration remain for T11 and T12. See the [assignment traceability matrix](assignment-traceability.md).

## Product objective

Build a small but complete multi-property hotel reservation web application that demonstrates React, Node.js with Express, REST APIs, PostgreSQL, JWT authentication, a third-party API, a professional GitHub workflow, and public cloud deployment.

The original assignment PDF remains local and excluded from Git. This document is the committed traceability record derived from it.

## Requirement classification

- Assignment: explicitly required by the internship specification
- Safeguard: necessary to make an assignment requirement correct, secure, or verifiable
- Optional: an enhancement that may be dropped without failing the assignment

## Assignment requirements

| ID  | Requirement                                                                                                           | Evidence required                                         |
| --- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| A01 | React frontend using React Router and Axios                                                                           | Production build and routed UI tests                      |
| A02 | Node.js and Express REST API                                                                                          | Public health endpoint and API integration tests          |
| A03 | PostgreSQL persistence                                                                                                | Migrations, constraints, seed data, and integration tests |
| A04 | Register, login, logout, and current-user access                                                                      | Authentication tests and complete browser journey         |
| A05 | Search hotels by city and stay dates                                                                                  | Search integration tests and customer journey             |
| A06 | List available hotels with name, city, rating, image, and starting price                                              | API contract and rendered results                         |
| A07 | Show hotel details and available room types                                                                           | API and page tests                                        |
| A08 | Check room availability for dates and guest count                                                                     | Boundary and inventory tests                              |
| A09 | Let an authenticated customer reserve an available room                                                               | Transaction and end-to-end tests                          |
| A10 | Let customers view their own reservations and statuses                                                                | Ownership tests and browser journey                       |
| A11 | Administrator hotel CRUD                                                                                              | Role and CRUD integration tests                           |
| A12 | Administrator room CRUD                                                                                               | Role and CRUD integration tests                           |
| A13 | Administrator reservation list and status updates                                                                     | Role, transition, and inventory tests                     |
| A14 | Prevent overlapping reservations                                                                                      | Date-boundary and concurrent booking tests                |
| A15 | Calculate total price from nights and room price                                                                      | Server-authoritative pricing tests                        |
| A16 | Integrate one non-core external API through the backend                                                               | Weather success, timeout, and fallback tests              |
| A17 | Use meaningful Git history, branches where appropriate, and pull requests                                             | Human-reviewed repository history                         |
| A18 | Provide README, `.gitignore`, and `.env.example` without committed secrets                                            | File checks and secret scan                               |
| A19 | Deploy frontend, API, and database with public frontend and API URLs                                                  | Production smoke test                                     |
| A20 | Provide local setup instructions                                                                                      | Clean-environment setup verification                      |
| A21 | The intern can explain the database, APIs, authentication, reservation logic, React data flow, errors, and deployment | Demonstration guide and human walkthrough                 |

## Engineering safeguards

| ID  | Safeguard                                                                  | Reason                                                                                   |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| S01 | Reservation creation uses a database transaction and row lock              | Prevents two customers from booking the last unit simultaneously                         |
| S02 | Passwords use Argon2id hashing                                             | Protects passwords if the database is exposed                                            |
| S03 | JWTs use secure HTTP-only cookies through same-origin API proxying         | Reduces token theft and cross-site cookie problems                                       |
| S04 | Server validates all untrusted input                                       | Prevents malformed data from reaching business logic or SQL                              |
| S05 | SQL statements are parameterized                                           | Prevents SQL injection                                                                   |
| S06 | Authorization is enforced by the backend using the current database role   | Prevents client-controlled or stale role decisions                                       |
| S07 | Authenticated responses use `Cache-Control: private, no-store`             | Prevents shared caching of customer data                                                 |
| S08 | Critical behavior has automated tests                                      | Makes completion independently verifiable                                                |
| S09 | UI is keyboard accessible, responsive, and does not rely on color alone    | Establishes a credible quality floor                                                     |
| S10 | Logs redact credentials, cookies, authorization data, and passwords        | Prevents secret leakage through diagnostics                                              |
| S11 | Every push is preceded by staged-diff and secret review                    | Protects the private repository and future public release                                |
| S12 | Reservation creation requires an idempotency key                           | Prevents duplicate bookings when a customer retries or double-submits the same request   |
| S13 | Every inventory-changing operation uses the same room-type lock            | Prevents booking, cancellation, deactivation, and inventory edits from racing each other |
| S14 | Optional browser tracking remains disabled until required consent          | Gives guests a real choice before non-essential data collection begins                   |
| S15 | Legal, accessibility, policy, and contact links are verified before launch | Prevents a visually complete footer from hiding missing or unreachable guest information |

## Explicitly out of scope

- Payment processing
- Customer cancellation
- Email confirmation
- Multiple rooms in one reservation
- Dynamic pricing
- Room-image uploads
- Hotel maps
- Reviews and ratings submitted by customers
- Loyalty accounts
- Microservices
- Refresh-token rotation
- Docker unless required to resolve a deployment problem
- Analytics beyond basic operational logs
- A complete property-management system

## Product rules

- The system contains multiple hotels in multiple cities.
- One `rooms` row represents a room type with `total_rooms` interchangeable units.
- One reservation books one unit of one room type.
- New reservations start as `confirmed`; there is no payment or approval workflow that requires a temporary hold.
- `confirmed` reservations consume inventory.
- `cancelled` reservations do not consume inventory and are terminal.
- Customers cannot select or modify reservation status.
- Check-in is inclusive and checkout is exclusive, so a checkout date can be another reservation's check-in date.
- Check-in cannot be in the past and checkout must be later than check-in.
- Guests must be a positive integer no greater than room capacity.
- The server snapshots the nightly price and calculates and stores the total from that snapshot.
- Retrying the same reservation request with the same idempotency key returns the original result instead of creating another reservation.
- Public registration always creates a customer.
- Hotel images use a validated same-origin asset path or an HTTPS URL whose host is on the server-configured allowlist, which is empty by default. Insecure HTTP, credentialed URLs, and unapproved remote hosts are rejected. File uploads are out of scope.
- Hotels and room types are deactivated instead of destructively deleted; inactive records stay available to historical reservations and are excluded from public browsing.
