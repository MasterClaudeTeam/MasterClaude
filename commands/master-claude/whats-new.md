---
description: What's new — check your Claude Code version, the official changelog, and whether MASTER CLAUDE has an update
allowed-tools: Bash, WebFetch, WebSearch, Read, Glob
---
As MASTER CLAUDE, give the developer a short, relevant "what's new" briefing. $ARGUMENTS

1. **Version** — run `claude --version`. If it's below **2.1.183**, note that MASTER CLAUDE's categorized
   skills need it and they should run `claude update` so every skill loads.
2. **Changelog** — `WebFetch` `https://code.claude.com/docs/en/changelog.md` and pull out only the items
   that are **new since their version** AND **relevant to this project/developer**. Skip the rest.
3. **MASTER CLAUDE updates** — remind them they can pull the latest skills/agents with
   `/plugin marketplace update masterclaude` then `/reload-plugins`.
4. **Ecosystem** — if something notable shipped (a new Claude model, a major Claude Code feature, or an
   ecosystem tool that fits their work), confirm with `WebSearch`/`WebFetch` and mention it in one line.

Keep it to a tight, skimmable briefing — what changed and why it matters for *them*. Never dump the whole changelog.
