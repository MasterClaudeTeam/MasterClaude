---
name: fe-design-review
description: >-
  Review UI before you ship it, like a picky designer. Triggers on "review this UI / page / component", "does
  this look good / professional", "is this accessible", before merging frontend work, or after building any
  interface. Returns findings labeled blocker / major / minor with the fix — across visual hierarchy, spacing,
  contrast & a11y, responsive behavior, interaction states, and consistency with the design system.
allowed-tools: Read, Grep, Glob, Bash
---

# Frontend design review — catch it before users do

An unsentimental design pass over the UI. Output findings as **blocker / major / minor**, each with *where*
(file or element) + a concrete fix, then a one-line verdict and the single first thing to fix.

## The checklist
- **Hierarchy** — is the one primary action obvious? does the eye land where it should? is there a clear h1?
- **Spacing & alignment** — a consistent rhythm from the scale? aligned to a grid? no cramped or random gaps?
- **Type** — readable body (≥ 15px)? sane line length (≤ ~75ch)? a clear scale? not too many fonts/weights?
- **Color & contrast** — one restrained accent? text ≥ 4.5:1, UI ≥ 3:1 (WCAG AA)? meaning never by color alone?
- **A11y** — semantic HTML? keyboard-operable with visible focus? labels / alt / names present? (spot-check the DOM.)
- **States** — `hover · focus · active · disabled · loading · empty · error` all handled, not just the default?
- **Responsive** — works 360px → 1440px? tap targets ≥ 44px? no horizontal scroll? do tables reflow?
- **Consistency** — uses the design-system tokens (not one-off colors/spacing)? components reused, not re-styled?
- **Polish** — transitions present and reasonable? respects `prefers-reduced-motion`? loading isn't a lone spinner?

## How to run it
Read the component + styles; if it runs, **exercise it** (the preview tools or a quick build) and inspect the
rendered result + DOM for the contrast / a11y / state items rather than guessing. Tie every finding to a
checklist item — no hand-waving — and lead with the highest-severity, highest-impact fix.

---
*The frontend sibling of `cap-self-review`. Uses `fe-design-system` as the consistency baseline; pairs with
`fe-component-craft`. Credits: WCAG, the WAI-ARIA APG, shadcn/Radix accessibility patterns.*
