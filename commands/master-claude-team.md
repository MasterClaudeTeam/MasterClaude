---
description: Show MASTER CLAUDE's team for this project — who's active, their role, and what each is for
allowed-tools: Read, Glob, Bash
---
Show the current **MASTER CLAUDE team** assembled for this project.

Read `.mc/team.md` (and check `.sentinel/` if Sentinel is on the team). Present, scannable:
- **The team so far** — each member MASTER CLAUDE has assembled, with its **role** and **why it was chosen** for this project.
- **Running in the background** — e.g. Sentinel's map status + open-findings count (from `.sentinel/`), or any guardrails that are active.
- **What to ask next** — one short suggestion based on the project's gaps.

If `.mc/team.md` doesn't exist yet, say MASTER CLAUDE isn't set up for this project yet and show the activation line: run `/master-claude`.
