---
description: Review what changed since the last Sentinel run; update the map and findings
argument-hint: "[--since <sha>]"
allowed-tools: Task
---
Use the **sentinel** subagent in **sweep** mode for this repository.

Instructions for the subagent:
- Follow the SWEEP algorithm in your system prompt. Diff base is `state.lastSHA` unless
  `$ARGUMENTS` provides `--since <sha>`.
- Compute the change set (committed + working tree), expand one hop to dependents, re-read those,
  update only the touched MAP sections, re-check open findings (auto-resolve only on positive
  evidence; mark stale if the anchor vanished), open new findings through the dedupe gate, and
  cross-link.
- Write only under `.sentinel/`. Never edit source.

When the subagent returns, summarize: files reviewed, findings opened / resolved / still-open, and
the current coverage line.
