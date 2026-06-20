# MASTER CLAUDE ☕

**A free, open-source Claude Code team.** Say **"master claude"** and a *leader* interviews you, maps your
project, and assembles a tailored team — **Sentinel** the project cartographer plus planning, review,
understanding and guardrail specialists — then runs it on your work. It also keeps itself (and you) current
with the newest Claude Code features.

No account. No API key. No vault. Everything is local, plain text, and open.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Buy me a coffee in TON](https://img.shields.io/badge/Buy%20me%20a%20coffee-TON-0098EA.svg)](https://masterclaude.shop/donate)

---

## What it is
MASTER CLAUDE is a Claude Code **plugin**: focused **skills** organized by category, a **Sentinel** agent,
and a **leader** skill that ties them together. Instead of installing a dozen tools you'll forget, you say
"master claude" once — it figures out what *this* project and *this* developer need, assembles the smallest
team that helps, gets to work, and brings in more members the moment a need shows up.

## Requirements
**Claude Code ≥ 2.1.183** (the categorized skill folders rely on nested-skill discovery). Check with
`claude --version`; if you're behind, run `claude update`.

## Quick start
1. **Install** (in Claude Code):
   ```
   /plugin marketplace add aturzone/MasterClaude
   /plugin install master-claude@masterclaude
   ```
2. **Run it** — in any project, say:
   ```
   master claude — set up my team for this project
   ```
   (or run `/master-claude`). It interviews you, maps the repo, and assembles your team.
3. **See your team** any time: `/master-claude-team`.

> Manual install (fallback): `git clone https://github.com/aturzone/MasterClaude` then
> `/plugin marketplace add ./MasterClaude` and `/plugin install master-claude@masterclaude`.

## The team
The leader picks a **minimal** subset per project — never all at once. Capabilities are organized by
category; each folder has a README that brainstorms what else belongs there (good first contributions).

- **`agents/` → Sentinel** — project cartographer; keeps a living map in `.sentinel/` and flags
  gaps / bugs / missing tests in real time. Read-only toward your source.
- **`skills/planning/`** — `grill-me` · `cap-plan-first` · `cap-spec-smith` · `cap-decomposer` — turn a
  fuzzy ask into a spec & plan.
- **`skills/review/`** — `cap-self-review` · `cap-red-team` — critique the diff and the design.
- **`skills/understand/`** — `cap-explain-senior` · `cap-rubber-duck` · `codehistorian` — explain, debug,
  and trace history.
- **`skills/guardrails/`** (the Guardian suite) — `guardian` · `supplyguard` · `testmedic` · `debtradar` ·
  `compactor` · `guardian-suite` — keep the work honest and the codebase healthy.
- **`skills/workflows/`** — `wf-codebase-audit` — big, multi-step jobs.

## How it works
1. **Interview (grill-me).** Developer → want → purpose → project → environment — one sharp question at a
   time, each with a recommended default. It explores the repo first and never asks what the code answers.
2. **Map.** Detects your stack and the gaps for *this* goal.
3. **Assemble.** Picks a tailored team from the installed skills and explains why each fits.
4. **Run.** Actually does the work with the team, and tells you what each member changed.

## Staying up to date
MASTER CLAUDE keeps itself current — it's your guide to the best of Claude Code. Ask it **"what's new"**
(or run `/master-claude:whats-new`) and it checks your Claude Code version, reads the official changelog,
and flags the new features relevant to *your* work.
- **Update the plugin:** `/plugin marketplace update masterclaude`, then `/reload-plugins`.
- **Update Claude Code:** `claude update`.

## Sentinel — the cartographer
Sentinel holds your whole repo as a living map and keeps it honest: every module, entry point, and
invariant recorded; every gap / bug / missing test surfaced as a tracked, cross-linked finding. It is
**read-only toward your source** — it only ever writes under `.sentinel/`.
- `/sentinel:map` — build (or rebuild) the full map and initial findings.
- `/sentinel:sweep` — review what changed since the last run.
- `/sentinel:report` — show the current map + open findings.

A session hook nudges you when the map drifts behind HEAD or criticals are open.

## Customization
Drop a `.claude/master-claude.json` in your project to steer the leader (all keys optional):
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
MASTER CLAUDE will recommend (never force) external tools when they fit: **superpowers** (broad TDD/review
base), **gsd** (spec-driven autonomous builds), **caveman** (fewer output tokens on long sessions).

## Contributing
This is a community project — PRs welcome. Add or sharpen a skill, an agent, or a workflow; each category
folder brainstorms what's needed (including **stack-specific** ideas). Contributors who want it can share a
**TON address with their PRs** and receive a slice of the month's donations (see below). Start here:
[CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).

## Support the project ☕
MASTER CLAUDE is free and open source. If it saves you time, **buy it a coffee in TON** — 100% on-chain,
wallet-to-wallet, no accounts or cards, and you can leave a message with your donation:
<https://masterclaude.shop/donate>
