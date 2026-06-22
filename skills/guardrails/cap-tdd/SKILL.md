---
name: cap-tdd
description: >-
  Test-driven development discipline — write the failing test first, then the smallest code to pass, then
  refactor green. Triggers on "TDD", "test first", "red green refactor", "write the test first", or when
  building logic where correctness matters and the behavior is specifiable up front (parsers, calculations,
  state machines, APIs, bug fixes). Keeps tests honest and code minimal; the test is the spec. Not for
  throwaway spikes or pure exploration.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# TDD — red, green, refactor

Write the test **before** the code. The failing test is your spec and your proof; the code exists only to
make it pass. This keeps you from building the wrong thing, over-building, or fooling yourself that it works.

## The loop
1. **RED** — write **one** small test for the next behavior. Run it; watch it **fail for the right reason**
   (a failing assertion, not an import error). A test you've never seen fail proves nothing.
2. **GREEN** — write the **minimum** code to make it pass. Don't add anything the test doesn't demand. Run
   the suite; it's green.
3. **REFACTOR** — now clean it up (names, duplication, structure) with the tests green as your safety net.
   Re-run after each change.
Repeat one behavior at a time. Small loops; commit at green.

## Rules (the discipline is the point)
- **No production code without a failing test that needs it.** If you can't write the test, you don't yet
  understand the requirement — clarify it first (grill-me).
- **One test at a time.** Don't write ten tests then code; the feedback loop is the value.
- **Test behavior, not implementation** — assert on inputs→outputs/effects, not private internals, so
  refactors don't break the tests.
- **Never weaken a test to go green.** If a test is hard to pass, that's signal — fix the code or the design,
  not the test. (Guardian enforces this.)
- **For a bug:** first write the test that **reproduces** it (RED), then fix until green — now it can't regress.
- **Delete means delete.** Code written *before* its test gets **deleted** and re-implemented from the test —
  not kept "as reference," not adapted. (Violating the *letter* of these rules is violating the *spirit* —
  no "I'm following the spirit" dodge.)

## The excuses — and the reality
Under pressure you'll hear these; they're all rationalizations:
| "…" | reality |
|---|---|
| too simple to test | simple code breaks too — it's where assumptions hide |
| I'll test after | a test that passes the moment you write it proves nothing |
| same goals either way | *after* answers "what does this do"; *first* answers "what should it do" |
| already tested manually | ad-hoc, no record, can't re-run, won't catch regressions |
| deleting this code is wasteful | sunk cost; keeping it = testing-after by another name |
| it's hard to test | hard-to-test = hard-to-use — fix the design, not the test |

**Red flags — stop and start over:** production code written before a test · a test that passed on first
run · you can't say *why* it failed · "this case is different because…" · "I'll add tests later."

## When to use it / when not
**Use** for logic with specifiable behavior: parsers, calculations, validation, state machines, API
contracts, and **every bug fix**. **Skip** (or test after) for throwaway spikes, pure UI/layout
exploration, or one-off scripts — match the rigor to the stakes.

## Verify honestly
"Green" means the **whole suite** stays green with **pristine output** (no new warnings/errors), not just
the new test passing. Make sure the tests exercise real behavior, not mocks: **assert on the component's
behavior, not the mock's**; a mock must mirror the *full* real schema (a partial mock missing a field
something downstream needs is a classic silent bug); never add test-only methods to production code. Pair
with **guardian** (blocks weakened/skipped tests) and **testmedic** (flaky suites).

---
*Credits:* strict red-green-refactor as an enforced discipline is core to **superpowers**
(`obra/superpowers`) and **mattpocock/skills** (both MIT). See `docs/ECOSYSTEM.md`.
