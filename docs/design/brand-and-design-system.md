# Stillwater Hotels Brand and Design System

Status: Design foundation validated and approved

## Brand

Stillwater Hotels is a fictional collection of full-service destination hotels in notable cities and waterfront locations. Each property has its own architectural character, supported by a consistent standard of service. The interface should feel established, confident, and trustworthy without becoming showy.

Visual direction: Harbor Quiet with Operational Clarity.

The primary mark combines a central architectural form, two curved wings, and three restrained water reflections. It is rendered as a flat single-color SVG and paired with the Stillwater Hotels wordmark. The shape follows the owner's selected generated concept without retaining raster shading.

A simplified micro-mark removes the smallest reflections and is used as the browser favicon. This keeps the identity recognizable at 16px and 24px without forcing the full navigation mark into an unsuitable size.

## Design principles

- Calm does not mean empty. Important booking facts remain visible.
- One visual signature is enough. The connected stay line carries dates, nights, guests, availability, and price.
- Photography establishes place. Interface decoration remains restrained.
- Customer pages breathe. Administrator pages use denser layouts with the same tokens.
- Actions use direct language such as `Find rooms`, `Reserve room`, and `Save changes`.
- Error messages explain what happened and how to recover.

## Color tokens

| Token         | Value     | Use                                          |
| ------------- | --------- | -------------------------------------------- |
| Atlantic ink  | `#112D33` | Primary text and strong structural details   |
| Petrol        | `#155C66` | Primary actions and selected states          |
| Deep petrol   | `#0D434B` | Hover and pressed actions                    |
| Mineral       | `#C6D7D5` | Quiet highlights and focus contrast          |
| Limestone     | `#F1F2EF` | Page background                              |
| Porcelain     | `#FBFBF8` | Elevated content surfaces                    |
| Aged brass    | `#9A7448` | Decorative rules and icons, never small text |
| Night         | `#102F35` | Branded header and administrator navigation  |
| Error red     | `#A63737` | Errors and destructive actions               |
| Success green | `#2E6A4F` | Confirmed and successful states              |
| Warning amber | `#8A5B12` | Caution states                               |

Automated browser checks verify contrast on the implemented pages at desktop, tablet, and mobile widths. New color combinations must pass the same checks before use.

## Typography

- Newsreader: display headings and selected editorial moments
- Manrope: body text, navigation, forms, buttons, tables, and administration
- Tabular numeral feature: prices, dates, guest counts, and inventory
- Fonts are installed as project dependencies rather than loaded from a third-party runtime CDN
- Body copy targets 16px with comfortable line height
- Supporting text never drops below 12px
- Content lines generally remain below 80 characters

## Type scale

- Display: responsive 48px through 72px
- Page heading: responsive 36px through 52px
- Section heading: 28px through 36px
- Component heading: 20px through 24px
- Body: 16px
- Secondary: 14px
- Caption: 12px

## Spacing

Base spacing scale:

```text
4, 8, 12, 16, 24, 32, 48, 64, 96px
```

- Minimum touch target: 44px by 44px
- Desktop page gutter: 32px through 64px
- Mobile page gutter: 16px through 20px
- Maximum reading width: approximately 720px
- Maximum application content width: approximately 1280px

## Shape and depth

- Small surfaces: 4px radius
- Buttons and inputs: 6px radius
- Major image and bounded content surfaces: 8px radius
- Pills are reserved for compact statuses, never ordinary buttons
- Borders provide most structural separation
- Shadows are used only when elevation communicates interaction or overlay order

## Buttons

### Primary

- Petrol fill with white text
- Deep-petrol hover and pressed state
- Visible keyboard focus ring outside the button edge
- Disabled state remains readable and cannot rely on opacity alone

### Secondary

- Transparent or porcelain surface
- Atlantic-ink border and label
- Quiet mineral hover surface

### Destructive

- Error-red label or fill depending on severity
- Confirmation dialog for irreversible deletion
- Never positioned beside the primary save action without separation

Every button has default, hover, focus-visible, pressed, loading, and disabled states.

## Forms

- Labels remain visible above inputs
- Placeholder text never replaces a label
- Search inputs, selects, and the primary action share a 52px minimum height and baseline
- Custom select menus preserve keyboard, focus, and screen-reader behavior while using the approved palette
- Validation appears next to the affected field
- Date fields remain keyboard operable
- Reservation validation is repeated by the server
- Password fields support show and hide controls with accessible labels

## Customer layout

- The home page opens with a full-bleed property photograph under a dark-to-transparent scrim, with the page title and summary set over the lower third
- The search panel is docked as an elevated card that overlaps the base of the hero, so the primary task stays immediately reachable without hiding the search behind the image
- A short assurance row (live availability, instant confirmation, no booking fees) sits under the search fields as an honest, factual value statement
- Hotel results use varied image rhythm rather than identical floating cards, with a restrained image zoom on hover
- Room options use structured rows containing capacity, availability, price, and action
- The stay line remains visible during reservation review
- Confirmation resembles a refined booking folio, not a novelty ticket
- Availability and calculated-price changes use concise `aria-live` announcements without narrating decorative updates
- The footer groups exploration, guest support, legal information, and reopenable cookie preferences

## Administrator layout

- Persistent desktop navigation and compact mobile navigation
- Tables for hotels, rooms, and reservations
- Clear filters and empty states
- Forms use the same controls as customer pages
- Status is communicated with both text and color
- Destructive actions require explicit confirmation

The independent review's ledger concept is retained only where it improves comprehension: the connected stay line, tabular numerals, booking folio, and operational administrator tables. The overall visual direction remains Harbor Quiet so the customer experience stays calm and place-oriented.

## Responsive checkpoints

- 320px: no horizontal page scrolling and all actions remain reachable
- 640px: forms may begin using two columns where labels remain clear
- 960px: customer content gains wider image and detail layouts
- 1280px: maximum content width prevents uncontrolled expansion

## Visual review gate

The customer search page and administrator table were reviewed at desktop and mobile widths. The owner approved the typography, spacing, controls, identity, navigation, room dialog, footer, and full-service hotel direction on September 15, 2026.

## Implemented preview surfaces

- `/design/customer`: city and date search, URL state, sample results, sorting, empty results, and room-detail dialogs
- `/design/admin`: sample reservation filters, a semantic table with horizontal scrolling and a pinned details action on narrow screens, and cancellation confirmation
- `/design/components`: button variants, loading and disabled states, labelled inputs, errors, status badges, and palette

These routes exist only in local development. Sample records never call booking or administrator mutation APIs. The real customer and administrator applications remain later tasks.

Shared components live in `frontend/src/components/`. Theme values live in `frontend/src/styles/tokens.css`; layout styling uses CSS Modules. Photos and fonts are local assets with documented [credits](asset-credits.md).

Verification includes 10 component tests and browser checks at 320px, 390px, 640px, 960px, and 1440px. The suite also checks 200 percent text scaling, favicon delivery, custom-select keyboard behavior, open-menu accessibility, aligned search controls, and dialog spacing. Native dialogs retain focus, close with Escape, and restore focus to their trigger. The full design command is `npm run verify:design`.
