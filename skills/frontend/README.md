# skills/frontend — make the frontend output excellent

MASTER CLAUDE skills for producing genuinely good UI — not default-looking AI frontend. The set covers the
whole loop: **set the system → pick the layout → craft the components → build from a reference → review it.**

## Current members
- **fe-design-system** — set tokens (color / type / spacing / radius / shadow / motion) before building.
- **fe-page-patterns** — the proven layout per page type (landing, dashboard, auth, pricing, docs, table, form…).
- **fe-component-craft** — accessible, responsive, every-state components.
- **fe-from-reference** — screenshot / brand / vibe → UI, via Claude artifacts, the visualize widget, or canvas-design.
- **fe-design-review** — a picky design + a11y pass before shipping.

## Good next contributions (brainstorm)
motion / animation craft · data-viz & charts · responsive email (HTML) · design-to-code from Figma · dark-mode &
theming depth · i18n / RTL layouts · Core Web Vitals & performance · form-UX depth · stack-specific kits
(Next.js app-router, SvelteKit, SwiftUI). Each = `skills/frontend/<id>/SKILL.md` + the stay-in-sync checklist
(`docs/ADDING-A-CAPABILITY.md`).

We build on the best — **Claude's own artifacts** + the Anthropic design skills (**canvas-design, theme-factory,
brand-guidelines, algorithmic-art**) — and reuse community systems (**shadcn/ui, Radix, Tailwind**). Credit
upstream; don't vendor. See **docs/ECOSYSTEM.md**.
