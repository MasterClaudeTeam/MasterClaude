---
name: clone
description: >-
  Build the user a "clone" — a digital-twin personal assistant, fronted by Telegram, that acts as them, runs
  on an immortal auto-reviving Claude Code session, and grows a private `.md` "brain" repo. Triggers on "build
  my clone", "make a clone of me", "digital twin", "personal assistant on telegram", "act as me", "my telegram
  assistant", "@clone". It interviews the user (grill-me), collects a bot token (env only) + the SSH of a
  private repo named `clone`, scaffolds the brain, and runs the bridge. Human-like: handles routine for known
  contacts, asks only for sensitive/new/irreversible — never moves money or shares secrets.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Task
---

# Clone — build the user a living digital twin

A **clone** is a digital twin of the user: a Telegram-fronted assistant that **acts as them**, runs on an
**immortal** Claude Code session (it auto-revives past usage limits), and **grows** a structured `.md` "brain"
in a **private git repo named `clone`**. It handles routine things for known contacts on its own and asks the
owner — over Telegram — only for the sensitive, new, or irreversible. Anyone can build one for themselves; you
build it *with* the user.

It's a **symbiosis**: a foreground Claude Code session (where you build and tend the clone) **+** a background
daemon (`clone-runner.mjs`) that owns Telegram and drives one fresh `claude` turn per message. They share state
on disk — that's what makes it survive crashes, reboots, and usage limits.

## The two iron rules (read first)
1. **Secrets live in a gitignored `.env`, never anywhere else.** The Telegram bot token and any credential go
   in `.env` (env var `TELEGRAM_BOT_TOKEN` …). **Never** inline a token in code, a prompt, the brain repo, the
   chat, or a commit. The brain stores **references** ("the Gmail token is in the project `.env`"), never
   values. This mirrors `sec-secrets-crypto`; `clone-brain.mjs` refuses to push secret-shaped strings.
2. **The clone discloses it's an agent on anything sensitive, and defers when unsure.** A trustworthy twin
   beats a seamless impersonator. First-person-as-the-user only for **known contacts + routine**; otherwise it
   identifies as the user's assistant, and it **never denies being an assistant when asked.**

## Setup — what you do with the user
Run this as a guided flow. Confirm before each side-effectful step.

1. **Explain + get the two inputs.** Tell the user what the clone is and what you need:
   - A **Telegram bot token** (from `@BotFather`). You'll put it in a gitignored `.env` — ask them to paste it
     *into the `.env` themselves* if possible; if they paste it in chat, write it straight to `.env` and don't
     echo it back. **Recommend they regenerate it (`/token` in BotFather) before going live** if it's been
     shared anywhere.
   - The **SSH url of a private repo named `clone`** they create (the brain). *They* create the empty private
     repo (`clone` never makes remotes); you take the SSH url.
2. **Protect secrets.** Ensure the project `.gitignore` has `.env` and `.clone/`. Copy `.env.example` → `.env`,
   fill in `TELEGRAM_BOT_TOKEN`, `CLONE_REPO_SSH`, `CLONE_OWNER_NAME`, `CLONE_LANG`.
3. **Preflight.** `node clone-doctor.mjs` — fix any FAIL (claude installed+logged-in, token valid, repo
   reachable, `.env`/`.clone/` ignored).
4. **Scaffold the brain.** `node clone-brain.mjs init "$CLONE_REPO_SSH"` — clones the repo and writes the
   skeleton if empty. Then **run the onboarding interview** (below) to fill it in.
5. **Pair + run.** `node clone-runner.mjs` — send `/start` from the owner's Telegram once to pair (the runner
   prints the chat id; set `CLONE_OWNER_CHAT_ID` in `.env` to lock it). Smoke-test with `--dry-run` first
   (echoes instead of calling claude).
6. **Make it immortal.** `node clone-register.mjs` to preview, then `--install` to register the boot-start +
   keep-alive daemon. Stop anytime with `touch .clone/STOP`.

## The brain repo (structured `.md`, references only)
The clone reads `CLONE.md` first every session, then grows the rest. Layout (scaffolded by `clone-brain.mjs`):

| Path | Holds |
|---|---|
| `CLONE.md` | Root index + load order. Read first. |
| `identity/` | `IDENTITY.md` (name/tz/langs/bio), `role.md` (company/title/manager/mandate), `aliases.md` (decoder ring) |
| `voice/` | `VOICE.md` (register per audience, tics, sign-offs, never-say) · `samples.md` (verbatim few-shot) · `phrases.md` · `persona_mode.md` (disclosure posture) |
| `access/` | `ACCESS.md` + `<system>.md` — role/scope + **credential pointer only, never the secret** |
| `projects/` | `PROJECTS.md` + `<slug>.md` (goal/status/stakeholders/where the clone may act) |
| `contacts/` | `CONTACTS.md` router + `<person>.md` (frontmatter `trust_tier`, `autonomy`, channels[refs], `sensitivity`) — **drives the autonomy model** |
| `routines/ROUTINES.md` | recurring rhythms: what/when/whom/channel/autonomy |
| `boundaries/BOUNDARIES.md` | the autonomy contract: `auto_allow` / `confirm_first` / `red_lines` + limits |
| `memory/` | `MEMORY.md` (derived index) + `M-XXXX.md` one fact per file (the MASTER CLAUDE memory pattern) |
| `journal/YYYY/…` | dated append-only event/conversation log |
| `decisions/DECISIONS.md` | append-only audit of every autonomous send + confirm-gated action |
| `state.json` | onboarding progress, open questions, counters |

House style follows Sentinel: frontmatter `.md` + `state.json` + **derived** indexes (rebuilt, not hand-authored).

## Onboarding — grill-me, one sharp question at a time
Use **grill-me**. Explore first (read OS/git/the existing brain — never ask what's readable), then walk these
waves depth-first, each question with a recommended default:
**identity → role/company → projects → access → key contacts → communication voice → routines →
boundaries/red-lines.** Per contact, capture: relationship, `@handle`/id (a reference), trust tier (known/new/
sensitive), contact window, sensitivity, and `autonomy` (auto/confirm/never).

**Capture voice by samples, not adjectives.** Ask the user to paste **5–10 real messages** (peer, boss, vendor,
friend); store them verbatim in `voice/samples.md`, derive a compact `VOICE.md` style sheet, draft one message
back, and ask *"sound like you?"*. Reproduce later by loading `VOICE.md` + the 2–3 samples matching the target
audience as few-shot. **"I don't know yet"** → record to `state.json.open_questions[]`, move on, **resume**
later; the clone **re-asks an ambiguous item the moment it's relevant** (e.g. before messaging a contact whose
`autonomy` is unset). Commit the brain after each meaningful update (`node clone-brain.mjs save "…"`).

## Autonomy & safety — resolve every outbound action in this order
1. **Catastrophe red-lines — refuse (never even offered as a confirm):** move/commit money; share secrets or
   2FA/recovery codes; make a legally/financially binding commitment; mass/irreversible sends; use the user's
   identity to **defeat a security/identity check**; destroy real data; exfiltrate the brain.
2. **Always-confirm over Telegram (sensitive OR new):** any `new` contact; any sensitive topic (money, legal,
   HR, exec, romantic); first message in a new thread; anything `confirm` in boundaries; any promise/commitment;
   any spend (money_cap default **$0** → always confirm). Confirm = draft the exact message, ask *"send to
   `<who>`? [y / n / edit]"*.
3. **Auto (act now, log it):** `known` contact **AND** `autonomy: auto` **AND** not sensitive **AND** within
   routines → send, then append `journal/` + `decisions/`. The human-like default.
4. **Defer (never idle):** missing info to decide → queue an open question, draft what you can, keep handling
   other threads. (god-mode's "never halt the whole mission", applied to messaging.)

**Unattended** (owner unreachable): every confirm-tier action **downgrades to defer/draft** — only auto-tier
sends go out; red-lines still refuse. (Same conservative-by-default split as god-mode normal vs Zeus.)

## The runtime (the engine)
- **`clone-runner.mjs`** — the immortal supervisor + Telegram bridge. Long-polls `getUpdates` (persists the
  offset before handling = dedupe), serves **only the owner's chat**, queues messages, and drives one fresh
  `claude --continue -p` turn each (crash-proof — durable state is on disk, not in a long process). The turn
  emits a `<<<REPLY>>>…<<<END>>>` block the bridge sends back, chunked.
- **Media reception (auth-gated).** The owner and **authenticated contacts** can send photos/videos/documents/
  audio/voice/etc.; the runner downloads each attachment (size-capped via `CLONE_MEDIA_MAX_MB`, default 20MB)
  to the gitignored `.clone/media/<key>/` and hands the local path to the Claude turn, which reads/analyzes the
  content. A caption becomes the message text. **Strangers are never downloaded from** — intake runs only after
  auth, so an unverified sender's attachment is never fetched (they still only get the share-contact prompt).
  Sender-supplied filenames are treated as hostile (basename only, no traversal/reserved chars, unique-prefixed)
  and media stays under the gitignored `.clone/` — never the brain, never the vault ciphertext, never committed.
  Through the bridge, file downloads use the `/file/bot<token>/…` endpoint the relay now also proxies.
- **Immortal reviver** (ported from the god-mode runner): on a usage/quota limit it sends the owner *"I'm out of
  usage right now"* **once**, keeps queuing, backs off, probes, and **auto-resumes + drains** when usage
  returns. A usage limit is a *pause*, not a stop. `touch .clone/STOP` halts everything; `.clone/PAUSE`
  soft-pauses.
- **`clone-register.mjs`** keeps it alive across reboots (schtasks/cron/launchd). **`clone-doctor.mjs`** is the
  health check (owner can run it via Telegram `/health`).

## Honest constraints (tell the user)
- **Telegram bots cannot DM arbitrary users** — a contact must have messaged the bot first or share a group
  with it. When a contact is unreachable, the clone **drafts the message for the owner to forward** instead of
  failing silently.
- The daemon runs `claude --dangerously-skip-permissions` (unattended) — the autonomy tiers + catastrophe rails
  + the owner allowlist are what keep that safe.

## Safety rails (always on)
Never store or echo a secret; the brain is references only and is never pushed with a secret in it. Only the
owner's chat is served. Confirm before sensitive/new/irreversible; refuse the catastrophe red-lines outright.
The user's standing instructions and basic safety **outrank this skill** — it changes the *pace and reach* of
acting-as-the-user, never *what is allowed*.

## Grow it
The clone improves from real use: new durable facts → `memory/`; events/decisions → `journal/` + `decisions/`;
voice corrections (when the owner edits a draft) → `voice/samples.md`; ambiguities → ask once, then remember.
Optionally schedule a nightly consolidation pass (see **scheduling**) to merge/prune memory and rebuild indexes.
The twin gets more autonomous as boundaries and contact policies fill in.

---
*Builds on MASTER CLAUDE patterns: **grill-me** (onboarding), **god-mode** (the immortal runner + ask/defer/rail
autonomy), **scheduling** (the keep-alive daemon), **Sentinel** + the memory convention (the on-disk brain). All
local, all `.md` + dependency-free Node — no server, no MCP.*
