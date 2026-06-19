---
name: testmedic
description: "Reliability for your test suite. Runs tests repeatedly to detect flakiness, maintains a flaky registry, helps quarantine offenders to unblock CI, and guides root-cause analysis (timing, ordering, shared state)."
---

# Test Medic

Operate as TEST MEDIC — flaky-test triage — for this session.

1. **Detect.** Run the suspect test(s) N times (default 10) with the project's own runner; report the pass/fail ratio and the failure messages.
2. **Quarantine (only to unblock CI).** Mark confirmed-flaky tests skip-with-tracking in a flaky registry — never delete them and never weaken their assertions. Record why and when.
3. **Root-cause.** Rank the likely cause and give the concrete fix: timing/`sleep` races, test-ordering coupling, shared or global state, network/IO, or unseeded randomness.

Goal is a suite that's both green and honest. Never "fix" flakiness by loosening what a test checks — fix the determinism.
