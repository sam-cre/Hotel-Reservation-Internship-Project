# Launch Readiness Checklist

Status: Evidence-backed through T12; production deployment is live and verified against the public URL

This checklist supplements the internship assignment. The assignment PDF remains authoritative. The checklist adapts objective checks from the owner's VORA Health project to a hotel reservation service and excludes clothing-commerce requirements that do not apply.

## How to use this checklist

- Each applicable item requires implementation evidence or a machine-checkable result before release.
- A check may be marked not applicable only with a recorded reason.
- Legal text requires owner and qualified legal review. Passing a technical check does not prove legal compliance.
- Automated checks are paired with manual keyboard, visual, and booking-flow review.

## Status legend

- Validated: implemented with evidence from the current test suites, source, or live production checks.
- Deferred: a recognized enhancement beyond the assignment's required scope, typically SEO or performance polish, not implemented.
- Owner review: needs the owner's judgment or qualified review, typically legal, policy, or editorial content.
- Accepted risk: a documented decision not to change current behavior for this assignment scope.
- N/A: out of scope, with the reason recorded.

Every item below is prefixed with its current status. Items are re-confirmed before final submission.

## Site integrity and security

- Validated: The frontend and API return successful responses over HTTPS. The live site returns HTTP 200 over HTTPS, and `/api/health` and `/api/ready` succeed through the Vercel-to-Railway proxy.
- Validated: HTTP redirects permanently to the matching HTTPS URL. The production domain returns a 308 permanent redirect from `http` to `https`.
- Validated: The production domain resolves correctly. The site is served at `https://hotel-reservation-internship-projec-six.vercel.app`; a custom domain is not in scope.
- Validated: Strict Transport Security is enabled. Responses carry `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- Deferred: A tuned frontend Content Security Policy and `Referrer-Policy` are present. Helmet sets baseline API headers and Vercel sets MIME-sniffing protection today; a tuned frontend CSP is a post-launch hardening task.
- Validated: No page loads insecure scripts, fonts, images, or API calls. Fonts and seeded images are same-origin and the site loads entirely over HTTPS.
- Validated: The viewport and UTF-8 character encoding are declared in `frontend/index.html`.
- Validated: The browser console has no uncaught application errors during critical journeys. The six Playwright journeys exercise the full customer and administrator flows and pass.
- Validated: Public error pages do not expose stack traces, SQL, credentials, or internal paths. The `backend/src/app.js` error middleware returns only a stable code, safe message, and request ID; authentication and weather tests assert sanitized errors.
- Validated: Internal links and required policy links return successful responses. `tests/customer/customer-journey.spec.js` exercises policy pages and cookie reopening, and the live production journeys pass.

## Search visibility and metadata

- Validated: Every public page has a descriptive, route-specific title. The `useDocumentTitle` hook sets a distinct title per customer and administrator route (`frontend/src/hooks/useDocumentTitle.js`, applied in the application shells), covered by a component test. A per-route meta description remains a T11 addition; `frontend/index.html` sets the default description today.
- Deferred: Canonical URLs identify the preferred public URL. Not configured; a post-launch SEO task.
- Deferred: Open Graph and social-card metadata produce a valid share preview. Not configured; a post-launch SEO task.
- Deferred: The social preview image is reachable, appropriately sized, and contains no private data. Not configured; a post-launch SEO task.
- Deferred: Public hotel pages use suitable `Hotel` or `LodgingBusiness` structured data. Not configured; a post-launch SEO task.
- Validated: Public pages have one clear H1 and a logical heading hierarchy. Design-system and axe checks assert heading structure.
- Validated: `robots.txt` permits intended public pages and blocks no public content by accident. `frontend/public/robots.txt` allows the search pages, disallows the account, booking, and administrator routes, and serves live at the production domain.
- Validated: `sitemap.xml` lists intended public pages and is referenced from `robots.txt`. `frontend/public/sitemap.xml` lists the home and search pages and serves live at the production domain.
- Validated: Customer account and administrator pages are excluded from search indexing. `robots.txt` disallows `/login`, `/register`, `/reserve`, `/reservations`, and `/admin`.
- Deferred: Search Console verification. Optional and not configured.

## Performance and assets

- Validated: Text responses use Brotli or gzip compression. The live site serves assets with `Content-Encoding: br`.
- Validated: Static assets use long-lived cache headers with content-hashed filenames. The Vite build emits content-hashed filenames, and `vercel.json` serves everything under `/assets` with `Cache-Control: public, max-age=31536000, immutable`.
- Validated: Authenticated and mutation responses are not stored by shared caches. `backend/src/app.js` sets `Cache-Control: no-store` on API responses.
- Validated: JavaScript and CSS are minified. The production build emits minified, hashed bundles. Unused-code review continues before release.
- Deferred: Images use WebP or AVIF where practical, with JPEG or PNG fallbacks only when justified. Seeded hotel images are currently JPEG at roughly 340 to 360 KB each; format conversion is a post-launch performance task.
- Deferred: Responsive `srcset` and `sizes` prevent phones from downloading desktop-sized hotel images. Images currently set explicit `width` and `height` but no `srcset`; a post-launch performance task.
- Validated: Every content image reserves its layout space. Hotel images set explicit `width` and `height` attributes in `SearchPage.jsx` and `HotelPage.jsx`.
- Validated: Above-the-fold imagery receives appropriate loading priority and below-the-fold imagery is lazy-loaded. `SearchPage.jsx` marks the first result eager and the rest lazy.
- Owner review: No delivered image exceeds the documented size budget without an approved reason. Current JPEGs are roughly 340 to 360 KB; the owner sets and approves the budget in T11.
- Deferred: Largest Contentful Paint, Cumulative Layout Shift, and interaction responsiveness meet the agreed mobile budgets. To be measured against the deployed site.
- Validated: The API stays warm on the owner's paid Railway plan, so there is no free-tier cold start to recover from. The frontend still shows loading states and never auto-retries a booking mutation; a `/api/ready` endpoint confirms live database connectivity, verified against the deployed site.

## Hotel and room information

- Owner review: Each hotel page provides its name, location, rating source, description, imagery, amenities, and contact information. Name, location, rating, description, imagery, and amenities come from the catalog. Amenities are a stored, administrator-editable field on each hotel (migration `003_add_hotel_amenities.sql`), so the search and hotel pages show real per-hotel amenities rather than a name-derived fallback. Contact information still needs a monitored production channel.
- Owner review: Each room type clearly states bed configuration, capacity, size, amenities, and accessible-room information when applicable. Capacity is stored; bed configuration, size, and accessible-room fields are not modeled and need an owner scope decision.
- Owner review: Hotel and room galleries provide meaningful alternative text and avoid duplicate or misleading imagery. Alt text is present; imagery accuracy is an owner content check.
- Validated: Search criteria remain visible through hotel, room, and reservation-review pages. URL-preserved criteria are covered by customer component and journey tests.
- Validated: Availability is identified as live server data and never inferred solely in the browser. The API computes availability and price; component tests assert the browser never sets authoritative price.
- Validated: Nightly rate, currency, night count, and total are clearly separated before confirmation. Reservation review shows the server total. Taxes and fees are out of scope, since payments are out of scope.
- Owner review: Cancellation, change, no-show, check-in, checkout, age, and identification rules are available before reservation confirmation. Reservation-terms content exists and requires owner and qualified review before release.
- Validated: The confirmation page repeats the hotel, room, dates, guests, price snapshot, status, and reservation identifier. Covered by the customer booking journey.
- Validated: Customer ratings are not represented as user-submitted reviews. Review submission is out of scope and the interface presents ratings as a numeric source only.

## Footer, trust, and guest support

- Validated: The footer links to destinations, booking, about, contact, accessibility, privacy, reservation terms, and cookie preferences. Structured footer navigation is covered by customer tests.
- Owner review: Contact information uses a monitored address or telephone number on the production domain. Needs a real monitored channel before release.
- Owner review: The accessibility page explains digital support and how to request accessible property or room information. Content exists and needs owner review.
- Owner review: Privacy information explains collected data, purposes, retention, processors, rights, and contact details. Content exists and needs owner and qualified review.
- Owner review: Reservation terms explain rates, changes, cancellations, no-shows, check-in requirements, and property rules. Payment timing and taxes are out of scope. Content needs owner review.
- Owner review: Every legal and support page is owner-reviewed, dated, reachable, and free of placeholder text before launch. Pages are reachable today; owner review and dating remain.
- Validated: The header mark and favicon use the approved identity. `frontend/index.html` references `favicon.svg`. The Apple touch icon and social image are added in T11.
- Validated: The interface contains no lorem ipsum, unfinished templates, fake endorsements, or misleading trust badges. Design copy review confirms this; owner spot-check continues.
- N/A: Newsletter capture and social links remain optional and are included only when real channels and an operating process exist. No newsletter or social channel is in scope.

## Cookies, privacy choices, and measurement

- Validated: Essential storage is documented and limited to functions required for security or user-requested behavior. The only server cookie is the HttpOnly authentication session; consent is stored without personal data.
- Validated: Non-essential analytics or marketing scripts remain disabled until the guest gives the required consent. No non-essential scripts load, since analytics is out of scope.
- Validated: Rejecting optional cookies is as easy as accepting them. Consent controls are covered by the customer suite.
- Validated: The footer lets guests reopen and change cookie preferences. Cookie reopening is covered by the customer journey.
- Validated: Withdrawing consent stops future non-essential collection. There is no non-essential collection to stop while analytics is out of scope.
- Validated: The consent choice is retained without storing personal information.
- N/A: No analytics event contains guest-identifying data, because no analytics is integrated.
- N/A: Analytics and advertising integrations remain out of scope unless the owner explicitly approves their purpose, consent behavior, and verification plan.

## Accessibility and responsive behavior

- Validated: Every action is reachable and usable with a keyboard in a logical order. Design-system and journey tests cover keyboard interaction.
- Validated: Focus is clearly visible, including inside menus and dialogs. Design-system browser tests cover focus treatment and the custom select.
- Validated: Form labels, instructions, errors, and status updates are programmatically associated. Component tests assert field-error association and `role="alert"` usage.
- Validated: Color is never the only way to communicate status or error meaning. Design review and axe checks cover this.
- Validated: Text and controls meet WCAG AA contrast. axe checks in the journeys and design-system contrast tests cover this.
- Validated: Touch targets are adequately sized with separation. Search controls share a 52px minimum height; design-system tests cover sizing. Owner spot-check continues.
- Validated: The complete customer and administrator journeys work at 320 pixels without page-level horizontal scrolling. The mobile journeys assert zero horizontal overflow at 320px.
- Validated: Zoom to 200 percent and browser text enlargement do not hide required actions. Design-system browser tests cover 200 percent text scaling.
- Validated: Reduced-motion preferences disable non-essential animation. `prefers-reduced-motion` rules are present across the base, component, customer, and admin styles and covered by design-system tests.
- Validated: Dialogs and custom menus manage focus, Escape, arrow keys, selection, and focus restoration correctly. Design-system tests cover the dialog and custom select.
- Owner review: Automated accessibility checks are supplemented by manual keyboard and screen-reader smoke tests. Automated axe checks pass; a manual screen-reader pass is an owner task before release.

## Brand and interface consistency

- Validated: Shared tokens control the approved colors, typography, spacing, radii, and focus treatment. Tokens live in `frontend/src/styles/` and are covered by design-system tests.
- Validated: Buttons with the same purpose use the same component, wording, size, and interaction states. The shared `Button` component is used across surfaces.
- Validated: Native and custom controls align to the documented sizing grid. Design-system tests cover control alignment.
- Validated: Heading sizes and body styles follow the documented type scale. Covered by design-system tests and the approved design foundation.
- Validated: Customer and administrator surfaces remain recognizably part of one system while preserving appropriate density. Both use the shared design system.
- Owner review: Copy is direct, specific, and free of clichéd luxury language. Design review confirms this; owner editorial spot-check continues.

## Verification and operations

- Validated: Formatting, lint, unit, integration, concurrency, component, accessibility, and end-to-end tests pass. `npm run verify:local` passes locally; PostgreSQL integration and concurrency tests run in the pull-request workflow.
- Validated: Dependency and secret scans report no unresolved high-confidence release blockers. `npm audit` reports zero advisories and the pinned Gitleaks scan plus foundation assertions cover secrets.
- Validated: Production customer and administrator journeys pass. The owner completed both live journeys against the public URL: booking a room and retrieving it, and administrator sign-in with hotel, room, and reservation management.
- Validated: Authentication cookies, cross-site request defenses, cache controls, and authorization work against the public URL. The live login-and-book and administrator journeys succeed through the same-origin proxy, and API responses carry `Cache-Control: no-store`.
- Validated: Database migrations, administrator provisioning, and rollback steps are documented in [database operations](../operations/database.md). Production backup expectations are finalized in T11.
- Validated: Health checks and logs expose no guest data or secrets. The liveness check at `/api/health` returns a fixed status, and the readiness check at `/api/ready` reports only `ready` or `unavailable` without leaking connection details, asserted in `backend/test/foundation.test.js` and confirmed live. Production operational alerting remains a post-launch operations task.
- Validated: A fresh setup follows the README with `npm ci` without undocumented local state. A formal fresh-checkout verification is re-run in T12.

## VORA checks intentionally excluded

The following clothing-commerce checks do not apply to this assignment and do not become project scope:

- Shopping cart or bag
- Shipping offers and delivery estimates
- Product materials and garment-care instructions
- Size guides and color variants
- Compare-at sale pricing
- Clothing product videos
- Return or exchange flows for physical goods
- Payment badges while payment processing remains out of scope

Hotel-specific equivalents such as room capacity, stay policies, arrival information, and rate transparency are covered above.
