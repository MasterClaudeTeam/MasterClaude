---
name: token-economy
description: >-
  Get the best output per token — optimize cost and context WITHOUT sacrificing quality. Triggers on "save
  tokens", "this is getting expensive", "long session", "token budget", "+500k", "be efficient", "use
  caveman", "stay cheap", or whenever a session runs long, output is verbose, or the user sets a budget.
  Levers: don't redo work, terse by default, isolate verbose work in subagents, cheap models for grunt work
  (model-router), caveman for output-heavy runs, compactor for context, and staying cache-friendly — while
  keeping the answer the best it can be. Optimize down to just before quality would drop, never past it.
allowed-tools: Read, Grep, Glob, Bash, Task
---

# Token economy — best output per token

The goal isn't "cheap." It's **the best result for the fewest tokens** — efficiency *and* quality at once.
Spending fewer tokens while getting the same or better output is a huge edge; spending fewer tokens for a
*worse* answer is just losing slowly.

## Levers (reach for them roughly in this order)
1. **Don't redo work.** Don't re-read files you've read, re-run the same search, or re-derive a settled fact
   — the harness tracks state and caches. The cheapest token is the one you never spend.
2. **Terse by default.** Lead with the answer; cut preamble, padding, and narrating options you won't take.
   You can always expand on request — but don't pay for words nobody asked for.
3. **Isolate verbose work in subagents.** Research, log-trawling, large file reads → a subagent, so only its
   *summary* returns and the bulk never bloats your main window. (See **subagent-orchestration**.)
4. **Right model, right effort** (**model-router**): Haiku + low effort for grunt work; the strong model only
   where reasoning actually earns it. "Turn count beats token price," but don't run Opus on a grep.
5. **caveman** for output-heavy sessions — the ecosystem tool that trims ~65% of *output* tokens on long
   runs. Offer it when sheer output volume (not reasoning) is the cost driver.
6. **compactor** before a context compaction — snapshot the thread so nothing's lost, and keep the working
   set lean so you aren't re-loading it later.
7. **Stay cache-friendly.** Keep stable prefixes stable; don't churn the early context — a warm prompt cache
   is a steep discount you keep paying for if you thrash it.

## Token awareness ("see the spend")
- **Know the budget.** A `+500k`-style directive is a hard ceiling — track spend against it and **scale depth
  to fit** (fewer or cheaper agents as you approach it). No budget given ⇒ be reasonable, not reckless.
- **Watch the burn.** Keep a rough sense of *where* tokens go — which phase, which agent — and flag when a
  step costs far more than its value. That's your signal to switch a lever (isolate it, cheapen the model,
  trim the output).
- **Report at checkpoints.** On a long run, a one-line "spent ~Xk so far, mostly on Y" gives the user a view
  of the burn without them having to ask.

## The rule that overrides the rest
**Quality first, then the cheapest path to it.** If trimming would make the output worse, don't — find a
cheaper route to the *same* quality instead (a smaller model that still nails it; a subagent to contain the
verbosity; a tighter prompt; a cache-friendly ordering). "Cheap but worse" is a failure. "Same or better,
for less" is the whole point.

---
*Credits / further reading:* **caveman** (output-token reduction) + Anthropic's prompt-caching and model
guidance. See `docs/ECOSYSTEM.md`. Pairs with **model-router**, **subagent-orchestration**, **compactor**.
