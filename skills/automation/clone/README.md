# clone — a digital-twin personal assistant

A MASTER CLAUDE capability that builds a **living clone of you**: a Telegram-fronted assistant that runs on
an **immortal, auto-reviving** Claude Code session and grows a structured `.md` "brain" in a **private git
repo named `clone`**. It handles routine things for known contacts on its own and asks you (over Telegram)
only for the sensitive/new/irreversible — never for normal work. See **[SKILL.md](SKILL.md)** for the full
methodology; MASTER CLAUDE drives the setup when you say *"build my clone."*

## What's here
| File | What it is |
|---|---|
| `SKILL.md` | The methodology MASTER CLAUDE follows to build + run your clone. |
| `clone-runner.mjs` | The immortal supervisor + Telegram bridge (the heart). |
| `clone-telegram.mjs` | Thin Telegram Bot API client (token from env only). |
| `clone-brain.mjs` | Provisions/syncs the private `clone` brain repo; refuses to push secrets. |
| `clone-register.mjs` | Registers the bridge as a boot-start, keep-alive daemon (schtasks/cron/launchd). |
| `clone-doctor.mjs` | Host readiness / health checks. |
| `.env.example` | The env template — copy to a **gitignored** `.env`. |

## Quick start (what the skill does for you)
```bash
# 1. you create a PRIVATE repo named `clone` and copy .env.example -> .env (fill token + repo SSH)
node clone-doctor.mjs            # check the host is ready
node clone-brain.mjs init "$CLONE_REPO_SSH"   # clone + scaffold the brain
node clone-runner.mjs            # run the bridge   (touch .clone/STOP to stop · --dry-run to smoke-test)
node clone-register.mjs --install  # keep it alive across reboots
```

## Safety
The bot token lives only in a **gitignored `.env`** — never in code or the brain. The brain stores
**references, not secrets**. Only your chat is served (allowlist). The clone confirms before sensitive/new
outbound and never moves money, shares secrets, makes binding commitments, defeats a security check, destroys
real data, or exfiltrates the brain.
