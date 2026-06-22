---
description: Build the user a "clone" — a Telegram-fronted digital-twin assistant on an immortal session with a private brain repo (triggers on "build my clone", "digital twin", "act as me")
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Task
---
As MASTER CLAUDE, build the user's **clone** (digital-twin assistant) for: $ARGUMENTS

Follow the `clone` skill. In short:
1. **Explain + collect two inputs** — a Telegram bot token (goes in a gitignored `.env` as
   `TELEGRAM_BOT_TOKEN`, **never inline it or echo it back**) and the **SSH url of a PRIVATE repo named
   `clone`** the user creates (the brain). Recommend they regenerate the token via `@BotFather` if it's been
   shared anywhere.
2. **Protect secrets** — ensure `.env` and `.clone/` are gitignored; copy `.env.example` → `.env` and fill it.
   Preflight with `node clone-doctor.mjs` and fix any FAIL.
3. **Scaffold the brain** — `node clone-brain.mjs init "$CLONE_REPO_SSH"`, then run the **grill-me onboarding**:
   identity → role/company → projects → access (references, never secrets) → key contacts → communication
   voice (capture from 5–10 real message samples) → routines → boundaries/red-lines.
4. **Pair + run** — `node clone-runner.mjs` (`--dry-run` to smoke-test first); send `/start` once from the
   owner's Telegram to pair, then set `CLONE_OWNER_CHAT_ID`. Make it immortal across reboots:
   `node clone-register.mjs --install`. Stop anytime: `touch .clone/STOP`.
5. **Autonomy** — auto for known contacts on routine matters; **confirm over Telegram** for sensitive / new /
   irreversible / any spend; **refuse outright** the catastrophe red-lines (move money, share secrets/2FA,
   binding commitments, defeating a security check, destroying real data, exfiltrating the brain). Asking never
   blocks other work; it discloses it's an assistant on anything sensitive and never denies being one.

Secrets live ONLY in the gitignored `.env`; the brain stores **references, not secrets**. The user's standing
instructions and basic safety outrank this skill.
