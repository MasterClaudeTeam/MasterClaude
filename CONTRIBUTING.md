# Contributing to MASTER CLAUDE

Thanks for helping make MASTER CLAUDE better. It's a collection of Claude Code **skills** and
**agents** plus a **conductor** that assembles them into a team for your project. Everything here is
plain text — no build step.

## Repo layout
```
.claude-plugin/plugin.json   # plugin manifest
skills/<name>/SKILL.md        # one skill per folder (frontmatter + a methodology body)
agents/sentinel.md            # the cartographer agent
commands/*.md                 # slash commands (master-claude, master-claude-team, sentinel:*)
hooks/                        # the Sentinel session nudge
```

## Add or improve a skill
1. Create `skills/<your-skill>/SKILL.md` with YAML frontmatter:
   ```markdown
   ---
   name: your-skill
   description: One or two sentences describing WHEN Claude should reach for this skill (this drives triggering).
   ---

   # Title

   The methodology — written as instructions to Claude ("You are …", "When X, do Y").
   ```
2. Keep it focused: one job, done well. A skill the developer actually uses beats a big one they ignore.
3. Test it locally (see below), then open a PR describing the gap it fills.

## Test locally
Install the plugin into a scratch project (see the README), then in Claude Code:
- run `master-claude` and confirm your skill is discovered and assembled when relevant;
- for the cartographer, run `/sentinel:map` then make a change and `/sentinel:sweep`.

## Guidelines
- **Honest and minimal.** No invented capabilities; no scope creep in a skill's body.
- **Read-only agents stay read-only.** Sentinel only ever writes under `.sentinel/`.
- **No secrets.** Never commit keys, tokens, or `.env` content.
- Match the surrounding style; keep frontmatter descriptions trigger-focused.

## Support the project
MASTER CLAUDE is free. If it helps you, [buy it a coffee](https://masterclaude.shop/donate) ☕ — see
`.github/FUNDING.yml` for all the ways. By contributing you agree your work is licensed under the
project's [MIT License](LICENSE).
