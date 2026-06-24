---
name: fe-page-patterns
description: >-
  The best-practice layout for whatever page you're building. Triggers when building or redesigning a landing
  page, dashboard, settings, login/signup, pricing, docs, blog, data table, form, profile/detail page, or an
  empty / error / loading state — or asking "how should this page be laid out / structured". Gives the proven
  structure, the visual hierarchy, and the common mistakes for each page type.
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Frontend page patterns — the right layout per page

Each page type has a proven shape. Start from it, then adapt to the content — don't reinvent the layout each time.

## Playbooks
| Page | Structure that works | Watch out for |
|---|---|---|
| **Landing** | nav · hero (one clear value prop + one primary CTA) · social proof · benefit-led features · FAQ · footer CTA | burying the CTA; listing features without benefits; more than one primary action |
| **Dashboard** | top bar + side nav · a row of KPI cards (with trend) · the primary chart/table · filters near the data | chart-junk; no empty state; KPIs with no comparison |
| **Settings** | left section nav · grouped forms · a save affordance per section · inline validation | one giant form; unclear what's saved; no confirmation |
| **Auth** | centered card · the one action · OAuth above the fold · clear error + a recovery link | tiny tap targets; hidden password toggle; vague errors |
| **Pricing** | 3–4 tiers · highlight the recommended one · feature matrix · monthly/annual toggle | too many tiers; hidden caveats; no FAQ |
| **Docs** | left nav tree · content column (~70ch) · right "on this page" TOC · search · copyable code | no search; walls of text; broken anchors |
| **Data table** | sticky header · sortable columns · row + bulk actions · pagination · empty state | no loading skeleton; hidden actions; not responsive (→ cards on mobile) |
| **Form** | one column · logical grouping · labels above · clear required/optional · inline errors · primary action bottom-right | multi-column inputs; placeholder-as-label; errors only on submit |
| **Detail / profile** | header (identity + key actions) · tabbed or sectioned body · related items aside | action overload up top; no clear hierarchy of facts |

## Always design the three other states
For any data-driven view, design **empty** (with a helpful next step), **loading** (skeletons, not a lone
spinner), and **error** (what happened + how to recover) — not just the happy path. They're where most UIs feel
unfinished.

## Hierarchy, every page
One primary action per screen. Group related things (proximity). Lead the eye top-left → down. Whitespace is
structure, not waste. Above the fold answers "what is this and what do I do next?".

---
*Pairs with `fe-design-system` (the tokens) and `fe-component-craft` (the parts). To build from a real
screenshot or brand, see `fe-from-reference`; to check the result, `fe-design-review`.*
