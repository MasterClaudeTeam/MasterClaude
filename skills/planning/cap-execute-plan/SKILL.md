---
name: cap-execute-plan
description: >-
  Drive an approved plan or spec to done — supervised, one verified step at a time. Triggers on "execute
  the plan", "work the backlog", "build it from the plan/spec", "implement this plan", or right after
  cap-plan-first / cap-decomposer / grill-me produced a plan. Works the tasks in order, verifies each
  (build/tests) before moving on, checkpoints with you at the risky/irreversible steps, and keeps a
  progress trail. The supervised cousin of GOD mode — you stay in the loop.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Task
---

# Execute the plan — supervised, verified, step by step

A plan only matters if it ships. This turns an approved plan/spec into working, verified code — without the
two failure modes: drifting from the plan, or barrelling past a broken step.

## Before you start
- You need an **approved** plan (from `cap-plan-first` / `cap-decomposer` / `grill-me`). If there isn't one,
  make one first — don't improvise a big build.
- Confirm the **definition of done** and the **verify command** (how you'll prove each step works).

## The loop (one task at a time)
1. **Take the next task** in order; respect dependencies. State what you're about to do in a line.
2. **Implement** the smallest correct change for *that* task — nothing the task doesn't call for.
3. **Verify** — run the build/tests/the step's check. **A task isn't done until it's proven.** If it fails,
   fix it before moving on; never leave a red step behind.
4. **Record** — mark the task done; note what changed + the proof. Commit at each green step (a working
   branch), so any step is easy to undo.
5. **Checkpoint at the risky ones** — before anything **irreversible or high-stakes** (a destructive
   migration, a schema change, touching prod/secrets, a big architectural commit), **pause and confirm**
   with the user. Everything else, keep moving.
6. **Re-plan when reality diverges** — if a task reveals the plan was wrong, stop, say so, adjust the plan,
   and continue. Don't force a broken plan.

## Stay honest
- Don't weaken a test or skip verification to "make progress." Green means green (Guardian holds here).
- If you can't verify a step locally, say so explicitly rather than claiming it's done.
- Keep the trail visible so the user can follow without re-reading the diff.

## vs. GOD mode
This is **supervised**: it checkpoints and expects you nearby. For a long **unattended** run that defers
blockers and resumes past usage limits, use **god-mode** instead. Same discipline (verify every step, keep
a trail) — different autonomy.

---
*Credits:* the plan→execute-with-verification discipline echoes **superpowers** writing-plans/executing-plans
(`obra/superpowers`, MIT). See `docs/ECOSYSTEM.md`. Pairs with **cap-plan-first** + **cap-decomposer**.
