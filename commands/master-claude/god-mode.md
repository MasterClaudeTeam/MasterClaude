---
description: Activate MASTER CLAUDE GOD mode — an autonomous, resumable build that runs until you stop it
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Task, WebSearch, WebFetch
---
As MASTER CLAUDE, enter **GOD mode** for: $ARGUMENTS

Follow the `god-mode` skill. In short:
1. **Confirm the mission + definition of done in one line**, then go. Ask at most 1–2 make-or-break
   questions only if the goal is truly ambiguous; otherwise state your assumptions and start.
2. **Initialize** `.mc/god-mode/` — write `MISSION.md`, then a prioritized `BACKLOG.md`.
   (Improving an existing project → audit first with Sentinel / wf-codebase-audit. Greenfield → design
   the architecture first.)
3. **Run the loop relentlessly**: next unblocked task → implement → **VERIFY (build/tests)** → journal it →
   repeat. Do **not** ask for confirmation on normal dev work.
4. **Defer blockers, don't stop**: anything needing the user (production/deploys, real secrets/credentials,
   money, publishing/outbound, shared-git pushes, irreversible/destructive actions) → `BLOCKERS.md`, then
   keep working everything else. Never idle.
5. Tell the user how to **keep it alive across usage limits** — `node .claude/skills/automation/god-mode/runner.mjs`
   (auto-resumes after a limit) — and how to **stop** it: `touch .mc/god-mode/STOP` or Ctrl-C.

Honor the god-mode **safety rails** at all times, keep tests honest, and leave a trail in `JOURNAL.md`.
When the definition of done is met, write `DONE` and give a crisp final report.
