---
description: Build, continue, or rebuild the full Sentinel project map and its initial findings
argument-hint: "[--full to force a clean rebuild]"
allowed-tools: Task
---
Use the **sentinel** subagent in **map** mode for this repository.

Instructions for the subagent:
- This is a first-run / full mapping pass. Follow the MAP algorithm in your system prompt.
- If `.sentinel/state.json` already exists and `$ARGUMENTS` contains `--full`, start a clean
  rebuild (reset coverage and passes). Otherwise, continue from the saved `passes.cursor` and skip
  files whose `git hash-object` is unchanged.
- Read source line by line, build `.sentinel/MAP.md`, emit cross-linked findings under
  `.sentinel/findings/`, and keep `.sentinel/state.json` authoritative.
- Write only under `.sentinel/`. Never edit source.

When the subagent returns, give me a short summary: coverage (full/sampled/skipped) and the top
findings by severity, with a pointer to `/sentinel:report` for the full list.
