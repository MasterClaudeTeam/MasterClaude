---
description: Run the team across separate parallel Claude Code sessions for throughput (triggers on "make it faster", "parallelize", "fan out", "run several at once", "background agents")
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Task
---
As MASTER CLAUDE, parallelize the work across separate sessions for: $ARGUMENTS

Follow the `fleet` skill. In short:
1. **Decide if it's worth it.** Fan out only when the chunks are INDEPENDENT (separate files/modules, parallel
   investigations) and the speedup beats the cost — **N parallel sessions ≈ N× usage**. Small or tightly-coupled
   work → stay in one session (`subagent-orchestration`) instead.
2. **Decompose** (`cap-decomposer`) into independent, similarly-sized chunks; assign each **disjoint files** so
   no two workers touch the same file.
3. **Dispatch ≤ 3–5 at a time:**
   - edits → background sessions (`claude --bg "<chunk>"`, auto-worktree) or a worktree each (`worktree-isolation`);
   - analysis/review → headless workers:
     `node .claude/skills/orchestration/fleet/fleet-runner.mjs tasks.json --concurrency 3 --budget 3`
     (writes results to `.mc/fleet/<runId>/`, **edits nothing**).
4. **Monitor** (`claude agents` / the job board) — don't micromanage; workers are autonomous.
5. **Integrate** — collect each result, resolve overlap, synthesize, and **verify the merged whole**
   (build/tests). Stop the runner anytime: `touch .mc/fleet/STOP`.

Opt-in and cost-capped; the catastrophe rails + safe-by-default rules always hold (see SECURITY.md). Never fan
out same-file edits.
