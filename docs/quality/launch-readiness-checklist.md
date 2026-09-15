# Launch Readiness Checklist

Status: Planned

This checklist supplements the internship assignment. The assignment PDF remains authoritative. The checklist adapts objective checks from the owner's VORA Health project to a hotel reservation service and excludes clothing-commerce requirements that do not apply.

## How to use this checklist

- Each applicable item requires implementation evidence or a machine-checkable result before release.
- A check may be marked not applicable only with a recorded reason.
- Legal text requires owner and qualified legal review. Passing a technical check does not prove legal compliance.
- Automated checks are paired with manual keyboard, visual, and booking-flow review.

## Site integrity and security

- [ ] The frontend and API return successful responses over HTTPS.
- [ ] HTTP redirects permanently to the matching HTTPS URL without a loop or excessive chain.
- [ ] The production domain resolves correctly and uses the approved custom domain when one is available.
- [ ] Strict Transport Security is enabled after HTTPS behavior is verified.
- [ ] Content Security Policy, frame protection, MIME sniffing protection, and an appropriate referrer policy are present.
- [ ] No page loads insecure scripts, fonts, images, or API calls.
- [ ] The viewport and UTF-8 character encoding are declared.
- [ ] The browser console has no uncaught application errors during critical journeys.
- [ ] Public error pages do not expose stack traces, SQL, credentials, or internal paths.
- [ ] Internal links and required policy links return successful responses.

## Search visibility and metadata

- [ ] Every public page has a descriptive, unique title and meta description.
- [ ] Canonical URLs identify the preferred public URL.
- [ ] Open Graph and social-card metadata produce a valid share preview.
- [ ] The social preview image is reachable, appropriately sized, and contains no private data.
- [ ] Public hotel pages use suitable `Hotel` or `LodgingBusiness` structured data.
- [ ] Public pages have one clear H1 and a logical heading hierarchy.
- [ ] `robots.txt` permits intended public pages and blocks no public content by accident.
- [ ] `sitemap.xml` lists intended public pages and is referenced from `robots.txt`.
- [ ] Customer account and administrator pages are excluded from search indexing.
- [ ] Search Console verification is configured only after a production domain exists.

## Performance and assets

- [ ] Text responses use Brotli or gzip compression.
- [ ] Static assets use long-lived cache headers with content-hashed filenames.
- [ ] Authenticated and mutation responses are not stored by shared caches.
- [ ] JavaScript and CSS are minified, and unused code is reviewed before release.
- [ ] Images use WebP or AVIF where practical, with JPEG or PNG fallbacks only when justified.
- [ ] Responsive `srcset` and `sizes` prevent phones from downloading desktop-sized hotel images.
- [ ] Every content image reserves its layout space to prevent page movement while loading.
- [ ] Above-the-fold imagery receives appropriate loading priority. Below-the-fold imagery is lazy-loaded.
- [ ] No delivered image exceeds the documented size budget without an approved reason.
- [ ] Largest Contentful Paint, Cumulative Layout Shift, and interaction responsiveness meet the agreed mobile budgets.
- [ ] The Render cold-start state remains understandable and provides a safe retry for reads only.

## Hotel and room information

- [ ] Each hotel page provides its name, location, rating source, description, imagery, amenities, and contact information.
- [ ] Each room type clearly states bed configuration, capacity, size, amenities, and accessible-room information when applicable.
- [ ] Hotel and room galleries provide meaningful alternative text and avoid duplicate or misleading imagery.
- [ ] Search criteria remain visible through hotel, room, and reservation-review pages.
- [ ] Availability is identified as live server data and never inferred solely in the browser.
- [ ] Nightly rate, currency, night count, taxes, fees, and total are clearly separated before confirmation.
- [ ] Cancellation, change, no-show, check-in, checkout, age, and identification rules are available before reservation confirmation.
- [ ] The confirmation page repeats the hotel, room, dates, guests, price snapshot, status, and reservation identifier.
- [ ] Customer ratings are not represented as user-submitted reviews because review submission is outside project scope.

## Footer, trust, and guest support

- [ ] The footer links to destinations, booking, about, contact, accessibility, privacy, reservation terms, and cookie preferences.
- [ ] Contact information uses a monitored address or telephone number on the production domain.
- [ ] The accessibility page explains digital support and how to request accessible property or room information.
- [ ] Privacy information explains collected data, purposes, retention, processors, rights, and contact details.
- [ ] Reservation terms explain rates, taxes, payment timing, changes, cancellations, no-shows, check-in requirements, and property rules.
- [ ] Every legal and support page is owner-reviewed, dated, reachable, and free of placeholder text before launch.
- [ ] The favicon, Apple touch icon, header mark, and social image use the approved identity consistently.
- [ ] The interface contains no lorem ipsum, unfinished templates, fake endorsements, or misleading trust badges.
- [ ] Newsletter capture and social links remain optional and are included only when real channels and an operating process exist.

## Cookies, privacy choices, and measurement

- [ ] Essential storage is documented and limited to functions required for security or user-requested behavior.
- [ ] Non-essential analytics or marketing scripts remain disabled until the guest gives the required consent.
- [ ] Rejecting optional cookies is as easy as accepting them.
- [ ] The footer lets guests reopen and change cookie preferences.
- [ ] Withdrawing consent stops future non-essential collection.
- [ ] The consent choice is retained without storing personal information.
- [ ] No analytics event contains names, email addresses, reservation identifiers, authentication data, or complete search details that could identify a guest.
- [ ] Analytics and advertising integrations remain out of scope unless the owner explicitly approves their purpose, consent behavior, and verification plan.

## Accessibility and responsive behavior

- [ ] Every action is reachable and usable with a keyboard in a logical order.
- [ ] Focus is clearly visible, including inside menus and dialogs.
- [ ] Form labels, instructions, errors, and status updates are programmatically associated.
- [ ] Color is never the only way to communicate status or error meaning.
- [ ] Text and controls meet WCAG AA contrast.
- [ ] Touch targets are at least 44 by 44 pixels with adequate separation.
- [ ] The complete customer and administrator journeys work at 320 pixels without page-level horizontal scrolling.
- [ ] Zoom to 200 percent and browser text enlargement do not hide required actions.
- [ ] Reduced-motion preferences disable non-essential animation.
- [ ] Dialogs and custom menus manage focus, Escape, arrow keys, selection, and focus restoration correctly.
- [ ] Automated accessibility checks are supplemented by manual keyboard and screen-reader smoke tests.

## Brand and interface consistency

- [ ] Shared tokens control the approved colors, typography, spacing, radii, and focus treatment.
- [ ] Buttons with the same purpose use the same component, wording, size, and interaction states.
- [ ] Native and custom controls align to the documented sizing grid.
- [ ] Heading sizes and body styles follow the documented type scale.
- [ ] Customer and administrator surfaces remain recognizably part of one system while preserving appropriate density.
- [ ] Copy is direct, specific, and free of clichéd luxury language.

## Verification and operations

- [ ] Formatting, lint, unit, integration, concurrency, component, accessibility, and end-to-end tests pass.
- [ ] Dependency and secret scans report no unresolved high-confidence release blockers.
- [ ] Production customer and administrator journeys pass using synthetic records.
- [ ] Authentication cookies, cross-site request defenses, cache controls, and authorization are verified against public URLs.
- [ ] Database migrations, backup expectations, administrator provisioning, and rollback steps are documented.
- [ ] Health checks, provider logs, and operational alerts expose no guest data or secrets.
- [ ] A fresh setup follows the README successfully without undocumented local state.

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
