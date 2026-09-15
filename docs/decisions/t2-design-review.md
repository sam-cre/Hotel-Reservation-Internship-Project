# T2 Design Review Reconciliation

Status: Resolved and validated on September 15, 2026

## Context

The owner approved the Stillwater identity, navigation, search layout, room dialog, structured footer, cookie controls, and full-service destination-hotel direction. An independent review then assessed the written implementation summary. The reviewer stated that it could not inspect the rendered interface, so visual claims were treated as prompts for targeted verification rather than established defects.

## Accepted findings

- Search inputs and selects now use a 52px minimum height instead of a fixed height. This preserves the approved baseline while allowing controls to grow when text is enlarged.
- A simplified micro-mark is supplied as `/favicon.svg`. It removes the smallest details that would not survive browser-tab sizes.
- Aged brass remains limited to decorative rules and icons. It is not used for small text on light backgrounds.
- Browser coverage now includes a 200 percent text-scaling check and direct favicon delivery verification.

## Refined findings

- The styled select remains a custom control because native option menus do not provide the approved cross-platform appearance. It uses a non-modal Headless UI listbox with keyboard navigation, visible focus, appropriate roles, and an automated accessibility audit while open.
- Physical iOS VoiceOver and Android TalkBack testing cannot be proven by desktop automation. It remains a manual device check in the T10 accessibility gate rather than an unsupported claim in T2.
- Atlantic ink and Night remain separate semantic tokens even though their values are close. Atlantic ink represents foreground content; Night represents branded dark surfaces. Their separate names allow either role to evolve without changing every consumer.
- Narrow administrator tables retain a keyboard-reachable details action. The complete reservation record remains available in a labelled dialog even when columns are visually reduced.

## Unchanged owner-approved choices

- The outlined `Book a stay` action remains in the header. Its contrast and focus state pass automated checks, and the owner approved its visual weight.
- `Hotels worth arriving for.` remains the preview headline. Copy refinement can occur when final hotel content exists, but it is not a technical blocker.
- Harbor Quiet remains the design direction. The interface already uses a restrained material edge through brass rules and destination photography, so a second visual pivot would add churn without solving an observed problem.

## Verification evidence

- `npm run verify:design`
- 11 backend foundation tests
- 10 frontend component tests
- 27 Playwright browser tests
- Browser widths: 320px, 390px, 640px, 960px, and 1440px
- Automated WCAG A and AA checks on customer, administrator, and component surfaces
- Open custom-select accessibility audit
- Production-build isolation check for sample administrator data

## Remaining manual gate

T10 must include physical-device checks with iOS VoiceOver and Android TalkBack before release. This is recorded as pending because desktop browser automation cannot substitute for mobile assistive technology.
