---
name: grill-me
description: Relentlessly interview the user with sharp clarifying questions to fully specify a vague or ambiguous request before building anything. Use when requirements are unclear, when the user types "grillme" or asks to be grilled/interviewed, or before any non-trivial implementation where scope, constraints, data shapes, edge cases, or success criteria are underspecified.
---

# Grill Me

Interrogate the request until it is unambiguous — then, and only then, build. A few minutes of pointed questions saves hours of building the wrong thing.

## When to run
- The user typed `grillme` / "grill me" / "interview me", OR
- The task is non-trivial and any of these are unclear: scope & non-goals, target user, inputs/outputs & data shapes, constraints (performance, platform, deadlines), success criteria, edge cases, dependencies, or how it integrates with what already exists.

## Rules
1. **Explore first.** Before asking anything, read the codebase (grep/read). If a grep or a file answers the question, do NOT ask it — resolve it yourself. Never ask what you can find.
2. **One question at a time.** Never dump a list. Ask, get the answer, and let it shape the next question. Walk down the decision tree; resolve dependencies between decisions in order.
3. **Always propose a recommended answer.** Every question carries your best default with a one-line rationale, so the user can just say "yes". Defaulting to "what do you think?" is lazy — do the thinking and let them correct you.
4. **Make answering cheap.** Offer 2–4 concrete options when you can, mark the recommended one, and keep each question short.
5. **Go deep, not wide.** Chase the consequences of each answer ("if X, then what about Y?") instead of skimming many shallow topics.
6. **Know when to stop.** Stop the moment you could write a precise spec with no remaining guesses.

## Loop
1. Restate the goal in one sentence.
2. Explore the code to pre-answer what you can; note your assumptions.
3. Ask the single most decision-changing open question — with a recommended answer.
4. Incorporate the answer; repeat step 3 until the spec is unambiguous.
5. Echo the final spec back (goal, scope, non-goals, approach, success criteria) and get a clear yes before building.

Be direct and curious, never interrogating for its own sake — every question must change what you will build.
