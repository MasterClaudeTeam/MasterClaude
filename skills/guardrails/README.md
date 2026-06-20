# guardrails/ — keep the work honest and the codebase healthy

The Guardian suite: guardrails that stop an agent from cutting corners, and analysis that keeps the
codebase in good shape.

**Current members**
- `guardian` — blocks weakened/skipped tests and false "done" claims; flags scope creep and new deps.
- `supplyguard` — blocks hallucinated, typosquatted, or vulnerable dependencies before they land.
- `testmedic` — detects flaky tests and root-causes the non-determinism (without weakening them).
- `debtradar` — ranks refactor targets by churn × complexity, so you fix what actually hurts.
- `compactor` — context-compaction safety for long sessions (snapshot/restore, timing nudges).
- `guardian-suite` — the switchboard to toggle the guardrails per-project or globally.

**Brainstorm — what else belongs here** (great first contributions)
- `secret-scanner` — block commits that add API keys / tokens / `.env` values.
- `license-checker` — flag a new dependency with an incompatible license.
- `coverage-gatekeeper` — refuse a "done" if coverage on touched lines dropped.
- `bundle-size-watcher` — warn when a change inflates the production bundle.
- **Stack-flavored gates:** `go-vet-gate`, `eslint-gate`, `mypy-gate`, `ruff-gate`, `clippy-gate`.

**Add one:** create `skills/guardrails/<your-skill>/SKILL.md`. See [CONTRIBUTING](../../CONTRIBUTING.md).
