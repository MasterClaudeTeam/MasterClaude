---
name: worktree-isolation
description: >-
  Run parallel or risky work without collisions using git worktrees. Triggers on "worktree", "isolate this
  change", "try this without touching main", "run these agents in parallel safely", "spike/experiment", or
  whenever multiple subagents or features would edit the same tree at once. Each task gets its own branch +
  working directory, so concurrent work never clobbers another's files and a failed experiment is thrown
  away by deleting a folder. Pairs with subagent-orchestration for true parallel building.
allowed-tools: Read, Grep, Glob, Bash
---

# Worktree isolation — parallel work that never collides

Parallel agents are only safe when they don't write to the **same files**. A git **worktree** gives each
task its own branch *and* its own working directory off the one repo — so two efforts run side by side
without stepping on each other, and a dead-end spike is discarded by removing a folder.

## When to use it
- You're about to **dispatch parallel subagents that edit code** (not just read) — give each its own worktree.
- A **risky experiment / spike** you want to try without polluting the main tree.
- **Several features/bugfixes** in flight at once.
- A long autonomous run (GOD mode) that wants a clean branch per task.

*Not needed* for read-only parallel work (research/review) — those don't write, so they can't collide.

## How
```bash
# one worktree per task, each on its own branch, all sharing the same repo/history
git worktree add ../wt-feature-x -b feature-x      # new branch in a sibling dir
git worktree add ../wt-bugfix-y -b bugfix-y
git worktree list                                   # see them all
# ...work happens in each dir independently...
git worktree remove ../wt-feature-x                 # discard a spike, or after merging
git worktree prune                                  # tidy stale entries
```
Rule: **one worktree per parallel writer.** Assign each subagent/teammate its own worktree path in its
delegation brief; never let two write the same tree.

## Lifecycle
1. **Create** a worktree+branch per parallel task (sibling dirs keep paths short).
2. **Work** — each agent stays in its own dir; commit there as it goes.
3. **Integrate** — review each branch, then merge the good ones (or open PRs); a fresh reviewer per branch
   pairs well here.
4. **Clean up** — `git worktree remove` the merged/abandoned ones; `prune` stragglers. Don't leave a
   graveyard of worktrees behind.

## Cautions
- Worktrees share the repo's objects + config — they're cheap, but **don't check the same branch out twice**.
- Build artifacts/deps may need re-installing per worktree (separate `node_modules`, etc.).
- Remember to remove them — orphaned worktrees confuse future sessions and tools.

---
*Credits:* git-worktree isolation for parallel agent work is a pattern from **superpowers**
(`obra/superpowers`, MIT). See `docs/ECOSYSTEM.md`. Pairs with **subagent-orchestration** + **model-router**.
