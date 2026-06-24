---
name: fe-from-reference
description: >-
  Turn a screenshot, a brand, a competitor, or a vibe into real UI — and pick the right Claude output channel
  for it. Triggers on "build this <screenshot>", "make it look like <site>", "match our brand", "design a
  hero / poster / social card", "a chart / diagram / mockup", "generate a UI for…", or design-to-code. Maps
  the request to a Claude artifact, the visualize widget, or the canvas-design / theme-factory / algorithmic-art
  skills, then reproduces the style faithfully (original assets only).
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Frontend from reference — image / brand / vibe → UI

Match what's given, faithfully — then make it real. First pick the channel for the job.

## Pick the output channel
| You want | Reach for |
|---|---|
| A real, interactive UI (React/HTML) | a **Claude artifact** — or write it straight into the project |
| An inline diagram / chart / dashboard / mockup to *show* in chat | the **visualize `show_widget`** (SVG/HTML) |
| A static poster / cover / social card (PNG/PDF) | the **canvas-design** skill |
| Apply a named look/theme to an artifact | the **theme-factory** skill |
| Generative / algorithmic art (flow fields, particles) | the **algorithmic-art** skill |
| Brand colors + type on any artifact | the **brand-guidelines** skill |

## Reproduce a reference faithfully
1. **Read it precisely** — sample the exact palette (hex), the type (family / weight / scale), spacing, radius,
   shadow, and the layout grid. Capture *tokens*, not vibes — this feeds `fe-design-system`.
2. **Structure first** — rebuild the layout + hierarchy, then skin it with the tokens, then the fine details.
3. **Match the style, don't copy the content** — reproduce the *look* for the user's own content; never
   reproduce a competitor's copyrighted text, images, or logos. **Original assets only.**
4. **Diff against the reference** — put them side by side and fix the spacing / weight / color that's off (the
   preview tools help here).

## From a brand or just a vibe
No reference? Derive a system from the brand (logo colors, voice) or from a vibe (3 adjectives → tokens), then
hand off to `fe-design-system` → `fe-page-patterns`. Show one strong option fast, then iterate.

---
*Feeds `fe-design-system`; built with Claude artifacts + the visualize widget + canvas-design / theme-factory /
algorithmic-art / brand-guidelines. Don't reproduce others' copyrighted content. See docs/ECOSYSTEM.md.*
