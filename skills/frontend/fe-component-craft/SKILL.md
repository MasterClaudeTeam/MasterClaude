---
name: fe-component-craft
description: >-
  Build UI components that are accessible, responsive, and complete — not just the happy path. Triggers when
  building a button, form, input, modal, dropdown/menu, table, card, nav, toast, tabs, tooltip, or any reusable
  component — or when UI "works but feels off", "isn't accessible", or "breaks on mobile". Covers a11y
  (semantics, ARIA, keyboard, focus), every interaction state, responsive behavior, and the polish that
  separates designed from default.
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Frontend component craft — accessible, responsive, complete

A component isn't done when it renders — it's done when it works for everyone, on every screen, in every state.

## Accessibility (non-negotiable)
- **Semantic HTML first** — `button` / `a` / `nav` / `label` / `table`; reach for ARIA only when no native
  element fits (the first rule of ARIA is don't use ARIA).
- **Keyboard** — everything operable without a mouse; a **visible focus ring** (never `outline:none` without a
  replacement); logical tab order; `Esc` closes overlays; arrow keys move within menus/listboxes.
- **Focus management** — trap focus inside an open modal, restore it to the trigger on close; move focus to new
  content (e.g. a revealed panel).
- **Names & labels** — every input has a `<label>`; icon-only buttons get `aria-label`; images get `alt`.
- **Contrast** — text ≥ 4.5:1, large text / UI elements ≥ 3:1 (WCAG AA).
- **Don't hand-roll** overlays, menus, comboboxes, dialogs — use **Radix** / headless primitives; they get the
  focus and keyboard model right.

## Every state, not just the default
`default · hover · active · focus-visible · disabled · loading · empty · error · selected`. A button that only
styles its default state is half-built. Show **loading** on async actions and disable to prevent double-submit.

## Responsive
Mobile-first. Fluid type/space with `clamp()`. Lay out with flex/grid + `gap`; **container queries** for
components that live in varying widths. Tap targets ≥ 44px. Tables become cards on narrow screens. Test
360px → 1440px; **never** produce a horizontal scrollbar.

## Polish (the last 10% that reads as "designed")
Consistent spacing from the scale · alignment to a grid · transitions on `transform`/`opacity` (120–200ms) ·
skeleton/optimistic loading · empty states that suggest the next action · honor `prefers-reduced-motion`.

---
*Verify with `fe-design-review`. Uses the tokens from `fe-design-system`. Credits: Radix / shadcn-ui, the
WAI-ARIA Authoring Practices (APG). See docs/ECOSYSTEM.md.*
