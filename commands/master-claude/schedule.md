---
description: Schedule a recurring or one-off autonomous MASTER CLAUDE run (cron / schtasks / launchd)
allowed-tools: Read, Grep, Glob, Bash, Write
---
As MASTER CLAUDE, set up a schedule for: $ARGUMENTS

Follow the `scheduling` skill:
1. **Pin the spec** — the task/command, the cadence (cron expression or schtasks cadence), the project
   directory (absolute path), and a short job name. Pick sensible defaults and state them; don't over-ask.
2. **Write a logging launcher** under `.mc/schedule/<name>.(sh|cmd)` so the schedule line is
   simple and every run is logged.
3. **Detect the OS**, build the exact scheduler command (cron on Linux/macOS, `schtasks` on Windows,
   launchd as an option), **show it, and confirm before installing** — a schedule is persistent config.
4. **Install**, verify it's registered, record it in `.mc/schedule/registry.md`, and tell the
   user where the logs go.

Keep scheduled runs scoped to **safe, well-defined work** — warn that they run unattended, and bound any
open-ended GOD mode schedule (e.g. `GOD_MAX_CYCLES`). On request, list and remove existing schedules.
