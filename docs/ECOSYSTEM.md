# MASTER CLAUDE — ecosystem & references

MASTER CLAUDE stands on the shoulders of the open Claude Code community. We **don't vendor other people's
skills** into this repo — instead we learn from the best public work, build our own original skills, and
point you at the originals so you can install them too. Everything below is **MIT-licensed** and worth
running alongside MASTER CLAUDE. The leader knows these and will recommend the right one when it fits.

## Recommended to install alongside MASTER CLAUDE
| Project | By | What it gives you | We learned… |
|---|---|---|---|
| **[superpowers](https://github.com/obra/superpowers)** | Jesse Vincent (`obra`) | A deep skills framework + methodology: brainstorming, plan-writing, **subagent-driven development**, **parallel-agent dispatch**, git-worktree isolation, strict TDD, systematic debugging, and a meta-skill for writing skills. | model-per-role ("turn count beats token price"), the two-loop reviewer, parallel-dispatch-by-cardinality, and trigger-only skill descriptions → shaped our `orchestration/` skills. |
| **[mattpocock/skills](https://github.com/mattpocock/skills)** | Matt Pocock | "Skills for real engineers" — the original viral **`grill-me`** interview skill, plus `to-prd`, `to-issues`, domain-modeling, TDD, handoff, and more. | one-question-at-a-time **with a recommended default**, codebase-grounded interviewing, depth-first decision-tree traversal, and interview→spec handoff → sharpened our `grill-me`. |
| **[Jekudy/grillme-skill](https://github.com/Jekudy/grillme-skill)** | Jekudy | An independent Socratic deep-interview skill that escalates in **waves** (basics → edge cases → contradictions/blind-spots). | wave-based question escalation → added to our `grill-me`. |
| **[gsd](https://github.com/glittercowboy/gsd)** | — | Spec-driven autonomous builds that resume across `/compact`. | a model for long autonomous runs (cf. our GOD mode). |
| **caveman** | — | Terse output mode (~65% fewer output tokens) for long sessions. | when to recommend trimming output on marathon sessions. |

> If you heard about MASTER CLAUDE alongside a Persian "**Kak [Alireza]**" recommendation, that most likely
> points to [Alireza Rezvani's skills aggregator](https://github.com/alirezarezvani/claude-skills), which
> **re-hosts** Matt Pocock's `grill-me` — the canonical upstream is `mattpocock/skills` above.

## Primary sources we build from
- Anthropic — [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- Anthropic — [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Claude Code docs — [subagents](https://code.claude.com/docs/en/sub-agents) · [agent teams](https://code.claude.com/docs/en/agent-teams) · [best practices](https://code.claude.com/docs/en/best-practices)
- Curated lists — [awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) · [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)

## How MASTER CLAUDE relates to these
- **MASTER CLAUDE is the leader.** It assembles a tailored team for *your* project and runs it. When an
  external tool fits better than anything in our archive, the leader recommends it (never silently forces it).
- **Our skills are original.** Where a technique came from a project above, we credit it in that skill's
  footer — we re-implemented the *idea*, not their files.
- **Licensing.** MASTER CLAUDE is MIT. The projects above are MIT. If you fork, keep each project's own
  license + attribution.

*Know a great public skill we should learn from or recommend? Open a PR adding it here.*
