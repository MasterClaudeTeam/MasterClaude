---
name: fe-design-system
description: >-
  Set the design foundation before building any UI, so the output looks designed, not default. Triggers when
  starting a new frontend, a redesign, a landing page, or a component library, and on "make it look
  good/professional", "it looks generic / like Bootstrap / AI-generated", or any UI work with no established
  visual system. Establish or detect design tokens (color, type scale, spacing, radius, shadow, motion), a
  font pairing, and a component vocabulary — reusing shadcn/Radix/Tailwind conventions — before writing components.
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Frontend design system — set the foundation first

Default-looking UI is the #1 tell of AI-generated frontend. Before building components, establish the system
they share. **Detect an existing one first** (read the repo's CSS / Tailwind config / token file); only invent
what's missing — never fight a system that's already there.

## The tokens (define once, use everywhere)
| Token | Define | Rule of thumb |
|---|---|---|
| Color | a neutral ramp (bg · surface · border · text/-2/-3) + **one** accent + semantic (success/warn/danger) | pick steps in OKLCH for even contrast; the accent is used sparingly |
| Type scale | a modular scale (~1.2–1.25 ratio): caption → body → h3 → h2 → h1 | body 15–17px; line-height ~1.5 body / ~1.1 headings; `clamp()` for fluid |
| Spacing | a 4px base scale (4 · 8 · 12 · 16 · 24 · 32 · 48 · 64) | a consistent rhythm beats eyeballed margins |
| Radius | 1–2 values (sm/md) + full | sharp = serious, round = friendly — match the brand |
| Shadow | 2–3 elevations, soft + low-opacity | subtle; never a hard near-black box-shadow |
| Motion | 1 easing + 2 durations (fast ~120ms, base ~200ms) | animate `transform`/`opacity`, not layout |

## What makes it look designed
- **One accent, restrained.** Color carries meaning; a rainbow reads amateur. Neutrals do the heavy lifting.
- **A consistent spacing rhythm** from the scale — the fastest path from "default" to "designed".
- **Type hierarchy** by size + weight + color together, not size alone.
- **Borders + surfaces** structure a layout better than heavy shadows.
- **Dark mode from the start** as CSS variables — don't bolt it on later.

## Reuse, don't reinvent
Lean on **shadcn/ui** + **Radix** primitives (accessible, unstyled) + **Tailwind** tokens, or the project's
framework (MUI/Chakra/Mantine). For a brand or a named look, the **theme-factory** and **brand-guidelines**
Claude skills apply. Emit the system as CSS variables (`:root` + `[data-theme="dark"]`) or a Tailwind/token
config the components import — one source of truth.

---
*Pairs with `fe-page-patterns` (what to build) and `fe-component-craft` (how to build it). Credits: shadcn/ui,
Radix, Tailwind; Anthropic theme-factory + brand-guidelines. See docs/ECOSYSTEM.md.*
