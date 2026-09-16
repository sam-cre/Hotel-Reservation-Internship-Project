# Administrator Application Operations

Status: Implemented in T8

## Purpose

The administrator application connects the approved Harbor Quiet workspace to the existing role-protected catalog and reservation APIs. It covers the assignment's hotel, room, and reservation management requirements without adding payment, analytics, bulk operations, or full property-management scope.

## Routes and access

| Route                 | Access        | Purpose                                                     |
| --------------------- | ------------- | ----------------------------------------------------------- |
| `/admin`              | Administrator | Redirect to the reservation register                        |
| `/admin/reservations` | Administrator | Search and filter reservations, inspect details, and cancel |
| `/admin/hotels`       | Administrator | Add, edit, and deactivate hotels and room types             |

`AuthProvider` restores the current account through `/api/auth/me`. The administrator route waits for restoration before rendering. An unauthenticated visitor returns to sign-in with a safe internal destination. A customer account receives an access-required page before any administrator data request is made.

The browser role check improves navigation and avoids unnecessary requests. Express authorization remains the security boundary and loads the current role from PostgreSQL for every protected request.

## Reservation workflow

- The register retrieves `GET /api/admin/reservations` and may send the documented `confirmed` or `cancelled` status filter.
- Search matches the already-loaded reservation identifier, customer, hotel, and room presentation. It does not change server authorization.
- Details show the server-returned guest, hotel, room, dates, guest count, status, and snapshotted total.
- Cancellation requires a second explicit confirmation and sends only `{ "status": "cancelled" }`.
- Cancellation is terminal. A conflict response remains visible and directs the operator to refresh the register.

## Hotel and room workflow

- Hotel forms send the complete documented mutation shape. Rating becomes a number before submission.
- Room forms send the complete documented mutation shape. Nightly price, capacity, and inventory become numbers before submission.
- Save controls disable while a request is pending, preventing accidental duplicate submissions.
- A server error leaves every form value in place so the operator can correct or retry the request.
- Hotel and room deletion controls perform historical-safe deactivation. They never promise physical deletion.
- Hotel deactivation explains that its room types leave public results while historical reservations remain readable.
- Room inventory conflicts preserve the submitted values and display the server's explanation.

## Interface behavior

- The workspace uses the approved Stillwater identity, color tokens, typography, and controls.
- Operational tables use tabular numerals and an action column pinned to the right edge of the scroll region.
- At narrow widths, the page itself stays contained while wide reservation data remains available through a labeled horizontal table region.
- Forms, confirmation states, loading messages, errors, and empty states do not rely on color alone.
- Dialogs retain keyboard focus, expose a named close action, and use at least 44px controls.

## Verification

Run focused component tests:

```powershell
npm --workspace frontend test -- admin
```

Run administrator browser journeys:

```powershell
npm run test:e2e -- admin-journey
```

Run the complete current gate:

```powershell
npm run verify:admin
```

The browser suite mocks the HTTP boundary so it can deterministically exercise every assignment management action. Express role authorization, input validation, soft deletion, reservation status rules, transaction locking, and PostgreSQL behavior remain covered by the T4 through T6 backend suites.

## Troubleshooting

- If the administrator route returns to sign-in, verify the authentication cookie, allowed origin, and `/api/auth/me` response.
- If an administrator receives the access-required page, confirm that the provisioned database user has the `admin` role and sign in again.
- If hotel or room edits return HTTP 400, compare the complete form payload with the API contract.
- If room capacity or inventory reduction returns HTTP 409, future confirmed reservations require the existing value. Preserve the record and choose a compatible value.
- If reservation cancellation returns HTTP 409, the reservation is already terminal. Refresh the register.
