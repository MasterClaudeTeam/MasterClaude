---
name: scheduling
description: >-
  MASTER CLAUDE's scheduling capability. Triggers on "schedule", "cron", "every night/week/day", "run
  this automatically at", "recurring", "set up a scheduled run", or "schedule god mode". Sets up
  recurring or one-off autonomous MASTER CLAUDE runs with the OS scheduler — cron on Linux/macOS,
  schtasks on Windows, launchd as an option on macOS. Common uses: a nightly Sentinel sweep, a weekly
  security audit, a daily GOD mode session that keeps clearing the backlog, or a one-off delayed task.
  It generates the exact scheduler command, confirms with the user, installs it, and can list or remove
  schedules.
allowed-tools: Read, Grep, Glob, Bash, Write
---

# MASTER CLAUDE — Scheduling

Set up MASTER CLAUDE to run **on a schedule, unattended** — a nightly sweep, a weekly audit, a daily
GOD mode push on the backlog, or a one-off "do this at 2am". You build the job, the OS runs it.

## How a scheduled MASTER CLAUDE run works
A scheduled job just runs the Claude CLI non-interactively in the project directory and logs the output:
```bash
cd <project> && claude -p "<task>" --dangerously-skip-permissions >> .master-claude/schedule/<name>.log 2>&1
```
For a GOD mode session, schedule the runner instead:
```bash
cd <project> && node .claude/skills/god-mode/runner.mjs >> .master-claude/schedule/<name>.log 2>&1
```
Because the run is unattended it uses `--dangerously-skip-permissions` (or the GOD mode runner, which
carries the god-mode safety rails). Tell the user that, and keep scheduled tasks scoped to safe work.

## Do this when asked to schedule something
1. **Pin the spec.** What command/task, how often (cron expression or schtasks cadence), the project dir
   (absolute path), and a short job `<name>`. Pick a sensible default and state it rather than over-asking.
2. **Write a launcher** so the schedule line stays simple and logs are kept. Create
   `.master-claude/schedule/<name>.sh` (or `.cmd` on Windows):
   ```bash
   #!/usr/bin/env bash
   cd "/abs/path/to/project" || exit 1
   mkdir -p .master-claude/schedule
   exec claude -p "your task here" --dangerously-skip-permissions >> ".master-claude/schedule/<name>.log" 2>&1
   ```
   `chmod +x` it. (For GOD mode, `exec node .claude/skills/god-mode/runner.mjs` instead.)
3. **Detect the OS and build the schedule command** (below). **Show the exact command and confirm before
   installing** — a scheduled job is persistent config.
4. **Install it**, then **verify** it's registered (list, below) and tell the user where the logs go.

## Per-OS

### Linux / macOS — cron
Append a line to the user's crontab (`crontab -e`, or programmatically):
```bash
( crontab -l 2>/dev/null; echo "0 2 * * * /abs/path/.master-claude/schedule/<name>.sh" ) | crontab -
```
Cron format: `min hour day-of-month month day-of-week`. Examples:
- `0 2 * * *` — every day at 02:00 · `0 9 * * 1` — Mondays 09:00 · `*/30 * * * *` — every 30 min.
- List: `crontab -l` · Remove: `crontab -l | grep -v '<name>.sh' | crontab -`.
Cron has a minimal `PATH`; use **absolute paths** in the launcher (including to `claude`/`node` —
`command -v claude`).

### macOS — launchd (alternative, survives reboots cleanly)
Write `~/Library/LaunchAgents/com.masterclaude.<name>.plist` with a `ProgramArguments` pointing at the
launcher and a `StartCalendarInterval`, then `launchctl load` it. Use this when cron timing is unreliable
(laptops that sleep).

### Windows — schtasks
```bat
schtasks /Create /TN "MasterClaude\<name>" /TR "\"C:\path\.master-claude\schedule\<name>.cmd\"" /SC DAILY /ST 02:00 /F
```
`/SC` = MINUTE|HOURLY|DAILY|WEEKLY|ONCE; `/ST` = start time; `/D MON` for weekly day.
- List: `schtasks /Query /TN "MasterClaude\<name>"` · Remove: `schtasks /Delete /TN "MasterClaude\<name>" /F`.
The `.cmd` launcher: `cd /d "C:\path\to\project" && claude -p "task" --dangerously-skip-permissions >> ".master-claude\schedule\<name>.log" 2>&1`.

## Recipe ideas
- **Nightly health sweep** — `claude -p "Run /sentinel:sweep, then summarize new findings to .master-claude/schedule/sweep-report.md"` at 02:00.
- **Weekly security audit** — `claude -p "Run the wf-security-audit workflow and write the report to .security/"` Mondays.
- **Daily debt check** — `claude -p "Run debtradar; list the top 3 hotspots and open a plan for the worst"`.
- **Daily GOD mode push** — `node .claude/skills/god-mode/runner.mjs` each morning for an hour
  (`GOD_MAX_CYCLES` or a `STOP` written by a paired "stop" schedule to bound it).
- **One-off delayed task** — cron with a far-future single date, or `schtasks /SC ONCE /SD <date> /ST <time>`; clean it up after.

## Cautions (tell the user)
- The **machine must be awake** at the scheduled time (laptops asleep won't run cron; consider launchd or
  waking policies).
- The CLI must **authenticate non-interactively** in the scheduler's environment, and `claude`/`node` must
  be on its `PATH` (use absolute paths).
- Scheduled runs are **unattended** — keep them to safe, well-scoped tasks; pair open-ended GOD mode
  schedules with a bound (`GOD_MAX_CYCLES`, or a STOP-writing companion job).
- Always keep logs (the launcher does) so a failed overnight run is debuggable.

## Manage existing schedules
On request, **list** all MASTER CLAUDE schedules (`crontab -l | grep .master-claude` / `schtasks /Query`
under `MasterClaude\`) and offer to **remove** or adjust any. Keep a note of what you created in
`.master-claude/schedule/registry.md` (name, cadence, command) so they're easy to find later.
