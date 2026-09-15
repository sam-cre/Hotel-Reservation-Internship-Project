# Stillwater Hotels Brand and Design System

Status: Planning

## Brand

Stillwater Hotels is a fictional collection of calm, design-conscious hotels in walkable cities. The interface should feel considered, quiet, and trustworthy without pretending to be an exclusive luxury club.

Visual direction: Harbor Quiet with Operational Clarity.

## Design principles

- Calm does not mean empty. Important booking facts remain visible.
- One visual signature is enough. The connected stay line carries dates, nights, guests, availability, and price.
- Photography establishes place. Interface decoration remains restrained.
- Customer pages breathe. Administrator pages use denser layouts with the same tokens.
- Actions use direct language such as `Find rooms`, `Reserve room`, and `Save changes`.
- Error messages explain what happened and how to recover.

## Color tokens

| Token         | Value     | Use                                        |
| ------------- | --------- | ------------------------------------------ |
| Harbor ink    | `#17383A` | Primary text and strong structural details |
| Tide teal     | `#0B676B` | Primary actions and selected states        |
| Deep tide     | `#074B4E` | Hover and pressed actions                  |
| Sea glass     | `#B7D7D2` | Quiet highlights and secondary surfaces    |
| Morning fog   | `#F3F7F6` | Page background                            |
| Salt white    | `#FFFFFF` | Elevated content surfaces                  |
| Driftwood     | `#806A4D` | Restrained warm accent                     |
| Error red     | `#A63737` | Errors and destructive actions             |
| Success green | `#2E6A4F` | Confirmed and successful states            |
| Warning amber | `#8A5B12` | Caution states                             |

Contrast must be tested against the actual backgrounds before tokens become validated.

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

- Small controls: 6px radius
- Buttons and inputs: 8px radius
- Major image and bounded content surfaces: 12px radius
- Pills are reserved for compact statuses, never ordinary buttons
- Borders provide most structural separation
- Shadows are used only when elevation communicates interaction or overlay order

## Buttons

### Primary

- Tide-teal fill with white text
- Deep-tide hover and pressed state
- Visible keyboard focus ring outside the button edge
- Disabled state remains readable and cannot rely on opacity alone

### Secondary

- Transparent or salt-white surface
- Harbor-ink border and label
- Quiet sea-glass hover surface

### Destructive

- Error-red label or fill depending on severity
- Confirmation dialog for irreversible deletion
- Never positioned beside the primary save action without separation

Every button has default, hover, focus-visible, pressed, loading, and disabled states.

## Forms

- Labels remain visible above inputs
- Placeholder text never replaces a label
- Validation appears next to the affected field
- Date fields remain keyboard operable
- Reservation validation is repeated by the server
- Password fields support show and hide controls with accessible labels

## Customer layout

- Search is prominent but does not cover a full-screen photograph
- Hotel results use varied image rhythm rather than identical floating cards
- Room options use structured rows containing capacity, availability, price, and action
- The stay line remains visible during reservation review
- Confirmation resembles a refined booking folio, not a novelty ticket
- Availability and calculated-price changes use concise `aria-live` announcements without narrating decorative updates

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

Before broad implementation, one customer search page and one administrator table are rendered at desktop and mobile widths. The system proceeds only after typography, spacing, buttons, forms, focus, and density are approved.
