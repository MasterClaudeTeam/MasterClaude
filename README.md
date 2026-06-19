# MASTER CLAUDE ☕

**A free, open-source Claude Code team.** Say **"master claude"** and a *conductor* interviews you,
maps your project, and assembles a tailored team — **Sentinel** the project cartographer plus
planning, review, and guardrail specialists — then runs it on your work.

No account. No API key. No vault. Everything is local, plain text, and open.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-❤-db61a2.svg)](https://github.com/sponsors/aturzone)
[![Buy me a coffee in TON](https://img.shields.io/badge/Buy%20me%20a%20coffee-TON-0098EA.svg)](https://masterclaude.shop/donate)

---

## What it is
MASTER CLAUDE is a Claude Code **plugin**: a collection of focused **skills** and a **Sentinel** agent,
held together by a **conductor** skill. Instead of installing a dozen tools you'll forget, you say
"master claude" once — it figures out what *this* project and *this* developer actually need, assembles
the smallest team that helps, and gets to work. Bring in more members the moment a need shows up.

## Quick start
1. **Install** (in Claude Code):
   ```
   /plugin marketplace add aturzone/master-claude-plugin
   /plugin install master-claude@masterclaude
   ```
2. **Run it** — in any project, say:
   ```
   master claude — set up my team for this project
   ```
   (or run `/master-claude`). It interviews you, maps the repo, and assembles your team.
3. **See your team** any time: `/master-claude-team`.

> Manual install (fallback): `git clone https://github.com/aturzone/master-claude-plugin` then
> `/plugin marketplace add ./master-claude-plugin` and `/plugin install master-claude@masterclaude`.

## The team
| Member | Kind | What it does |
|---|---|---|
| **sentinel** | agent | Project cartographer — keeps a living map in `.sentinel/`, flags gaps/bugs/missing tests in real time. Read-only toward your source. |
| **grill-me** | skill | Interrogates a vague request into a precise spec before building. |
| **cap-plan-first** | skill | Refuses to code until there's a tight plan with a scope guard. |
| **cap-spec-smith** | skill | Turns a fuzzy idea into a one-page spec. |
| **cap-decomposer** | skill | Splits a task into the smallest steps with risk/size/done-checks. |
| **cap-red-team** | skill | Adversarial pre-mortem — failure modes before they bite. |
| **cap-self-review** | skill | Unsentimental PR self-review of your own diff. |
| **cap-rubber-duck** | skill | Disciplined debugging partner. |
| **cap-explain-senior** | skill | Mental model + gotchas + when-not-to-use. |
| **guardian** | skill | Scope + verification guardrails — blocks weakened tests and false "done". |
| **supplyguard** | skill | Catches hallucinated / typosquatted / vulnerable dependencies. |
| **testmedic** | skill | Flaky-test detection and root-cause analysis. |
| **debtradar** | skill | Ranks tech-debt hotspots by churn × complexity. |
| **codehistorian** | skill | Git archaeology — why is this code like this? |
| **compactor** | skill | Context-compaction safety: snapshot/restore, timing nudges. |
| **guardian-suite** | skill | Switchboard for the guardrail set. |
| **wf-codebase-audit** | skill | A line-by-line, whole-repo audit pass. |

The conductor picks a **minimal** subset per project — not all of them at once.

## How it works
1. **Interview (grill-me).** Developer → want → purpose → project → environment — one sharp question at
   a time, each with a recommended default. It explores the repo first and never asks what the code answers.
2. **Map.** Detects your stack and the gaps for *this* goal.
3. **Assemble.** Picks a tailored team from the installed skills and explains why each fits.
4. **Run.** Actually does the work with the team, and tells you what each member changed.

## Sentinel — the cartographer
Sentinel holds your whole repo as a living map and keeps it honest: every module, entry point, and
invariant recorded; every gap / bug / missing test surfaced as a tracked, cross-linked finding. It is
**read-only toward your source** — it only ever writes under `.sentinel/`.
- `/sentinel:map` — build (or rebuild) the full map and initial findings.
- `/sentinel:sweep` — review what changed since the last run.
- `/sentinel:report` — show the current map + open findings.

A session hook nudges you when the map drifts behind HEAD or criticals are open.

## Customization
Drop a `.claude/master-claude.json` in your project to steer the conductor (all keys optional):
```json
{
  "autonomy": "ask",
  "verbosity": "normal",
  "defaultGuardrails": ["guardian", "sentinel"],
  "preferredEcosystem": ["superpowers"],
  "offProactive": false
}
```

## Plays nicely with the wider ecosystem
MASTER CLAUDE will recommend (never force) external tools when they fit: **superpowers** (broad TDD/
review base), **gsd** (spec-driven autonomous builds), **caveman** (fewer output tokens on long sessions).

## Support the project ☕
MASTER CLAUDE is free and open source. If it saves you time, you can **buy it a coffee**:
- **TON** — a "buy me a coffee" in TON: <https://masterclaude.shop/donate>
- **GitHub Sponsors** — <https://github.com/sponsors/aturzone>
- **Ko-fi** — <https://ko-fi.com/aturzone>
- **Open Collective** — <https://opencollective.com/master-claude>
- **Buy Me a Coffee** — <https://www.buymeacoffee.com/aturzone>

## Contributing
PRs welcome — add or sharpen a skill. See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).
