# Launch Readiness Checklist

Status: Evidence-backed through T10 local hardening; deployment items pending T11

This checklist supplements the internship assignment. The assignment PDF remains authoritative. The checklist adapts objective checks from the owner's VORA Health project to a hotel reservation service and excludes clothing-commerce requirements that do not apply.

## How to use this checklist

- Each applicable item requires implementation evidence or a machine-checkable result before release.
- A check may be marked not applicable only with a recorded reason.
- Legal text requires owner and qualified legal review. Passing a technical check does not prove legal compliance.
- Automated checks are paired with manual keyboard, visual, and booking-flow review.

## Status legend

- Validated: implemented with local evidence from the current test suites or source, as of T10.
- Pending T11: depends on production deployment, hosting configuration, or a live public URL.
- Owner review: needs the owner's judgment or qualified review, typically legal, policy, or editorial content.
- Accepted risk: a documented decision not to change current behavior for this assignment scope.
- N/A: out of scope, with the reason recorded.

Every item below is prefixed with its current status. Items are re-confirmed in T11 and T12 before release.

## Site integrity and security

- Pending T11: The frontend and API return successful responses over HTTPS.
- Pending T11: HTTP redirects permanently to the matching HTTPS URL without a loop or excessive chain.
- Pending T11: The production domain resolves correctly and uses the approved custom domain when one is available.
- Pending T11: Strict Transport Security is enabled after HTTPS behavior is verified.
- Pending T11: Content Security Policy, frame protection, MIME sniffing protection, and an appropriate referrer policy are present. Helmet sets baseline API headers today; the production frontend CSP, including `img-src` for any approved image host and `Referrer-Policy`, is configured in T11.
- Pending T11: No page loads insecure scripts, fonts, images, or API calls. Fonts and seeded images are same-origin today; this is re-verified against the deployed origin.
- Validated: The viewport and UTF-8 character encoding are declared in `frontend/index.html`.
- Validated: The browser console has no uncaught application errors during critical journeys. The six Playwright journeys exercise the full customer and administrator flows and pass.
- Validated: Public error pages do not expose stack traces, SQL, credentials, or internal paths. The `backend/src/app.js` error middleware returns only a stable code, safe message, and request ID; authentication and weather tests assert sanitized errors.
- Validated locally: Internal links and required policy links return successful responses. `tests/customer/customer-journey.spec.js` exercises policy pages and cookie reopening. Production reachability is re-verified in T11.

## Search visibility and metadata

- Pending T11: Every public page has a descriptive, unique title and meta description. Today `frontend/index.html` sets one static title and description; per-route metadata is added in T11.
- Pending T11: Canonical URLs identify the preferred public URL.
- Pending T11: Open Graph and social-card metadata produce a valid share preview.
- Pending T11: The social preview image is reachable, appropriately sized, and contains no private data.
- Pending T11: Public hotel pages use suitable `Hotel` or `LodgingBusiness` structured data.
- Validated: Public pages have one clear H1 and a logical heading hierarchy. Design-system and axe checks assert heading structure.
- Pending T11: `robots.txt` permits intended public pages and blocks no public content by accident.
- Pending T11: `sitemap.xml` lists intended public pages and is referenced from `robots.txt`.
- Pending T11: Customer account and administrator pages are excluded from search indexing.
- Pending T11: Search Console verification is configured only after a production domain exists.

## Performance and assets

- Pending T11: Text responses use Brotli or gzip compression. This is host and CDN configuration.
- Pending T11: Static assets use long-lived cache headers with content-hashed filenames. The Vite build already emits content-hashed asset filenames; the cache headers are host configuration.
- Validated: Authenticated and mutation responses are not stored by shared caches. `backend/src/app.js` sets `Cache-Control: no-store` on API responses.
- Validated: JavaScript and CSS are minified. The production build emits minified, hashed bundles. Unused-code review continues before release.
- Pending T11: Images use WebP or AVIF where practical, with JPEG or PNG fallbacks only when justified. Seeded hotel images are currently JPEG at roughly 340 to 360 KB each; format conversion is a T11 performance task.
- Pending T11: Responsive `srcset` and `sizes` prevent phones from downloading desktop-sized hotel images. Images currently set explicit `width` and `height` but no `srcset`.
- Validated: Every content image reserves its layout space. Hotel images set explicit `width` and `height` attributes in `SearchPage.jsx` and `HotelPage.jsx`.
- Validated: Above-the-fold imagery receives appropriate loading priority and below-the-fold imagery is lazy-loaded. `SearchPage.jsx` marks the first result eager and the rest lazy.
- Owner review: No delivered image exceeds the documented size budget without an approved reason. Current JPEGs are roughly 340 to 360 KB; the owner sets and approves the budget in T11.
- Pending T11: Largest Contentful Paint, Cumulative Layout Shift, and interaction responsiveness meet the agreed mobile budgets. Measured against the deployed site.
- Pending T11: The Render cold-start state remains understandable and provides a safe retry for reads only. The frontend already shows loading states and never auto-retries a booking mutation; verified against the live cold start in T11.

## Hotel and room information

- Owner review: Each hotel page provides its name, location, rating source, description, imagery, amenities, and contact information. Name, location, rating, description, and imagery come from the catalog. The amenity list on the search page is currently partly derived from hotel name with a generic fallback, which can misrepresent administrator-created hotels; the owner decides whether to make amenities a stored field before release.
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
- Pending T11: Production customer and administrator journeys pass using synthetic records. Local journeys pass; the production run is a T11 task.
- Pending T11: Authentication cookies, cross-site request defenses, cache controls, and authorization are verified against public URLs. Verified locally today; re-verified against the deployed origin in T11.
- Validated: Database migrations, administrator provisioning, and rollback steps are documented in [database operations](../operations/database.md). Production backup expectations are finalized in T11.
- Validated locally: Health checks and logs expose no guest data or secrets. Production operational alerts are configured in T11.
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
