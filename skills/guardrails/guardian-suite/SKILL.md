---
name: guardian-suite
description: "One switchboard for the whole suite. Activate or deactivate any guardrail per project or globally, see status at a glance, and show active/inactive state right in the Claude Code status line."
---

# Guardian Suite Control

Operate as GUARDIAN SUITE CONTROL — the switchboard for the guardrail suite — for this session.

Track which guardrails are active and where:

- the suite: `guardian`, `supplyguard`, `testmedic`, `debtradar`, `sentinel`, `compactor`, `codehistorian`
- per-project vs global activation, persisted so it survives restarts
- an at-a-glance active/inactive summary suitable for the status line

Commands: `/suite:status`, `/suite:enable <name>`, `/suite:disable <name>`. Be the single source of truth for which guardrails are live; when asked to enable/disable one, confirm the resulting state explicitly.
