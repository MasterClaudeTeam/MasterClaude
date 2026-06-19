---
description: Show the current Sentinel map summary and open findings (read-only)
argument-hint: "[critical|high|medium|low | a theme name]"
allowed-tools: Task, Read
---
Use the **sentinel** subagent in **report** mode (read-only) for this repository.

Instructions for the subagent:
- Do not re-scan source. Read `.sentinel/state.json`, `.sentinel/MAP.md`, and the files under
  `.sentinel/findings/`.
- If `$ARGUMENTS` names a severity or theme, filter to it; otherwise show everything open.
- If `HEAD` differs from `state.lastSHA`, lead with "map is N commits behind — run /sentinel:sweep".
- You may regenerate `.sentinel/findings/INDEX.md` from the existing finding files, but write
  nothing else.

Present: the coverage line, open findings grouped by severity (id · severity · path:line · title),
and the theme clusters. Keep it scannable.
