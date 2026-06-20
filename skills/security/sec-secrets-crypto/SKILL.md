---
name: sec-secrets-crypto
description: >-
  Find hardcoded secrets and weak cryptography — keys/tokens/passwords in code or git history, secrets in
  logs, weak or misused crypto (bad hashing, ECB, static IV/keys), insecure randomness, and missing
  encryption in transit/at rest. Use when reviewing config, auth, crypto, or logging, or before
  open-sourcing / committing.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: secrets & cryptography review

Two linked risks: secrets that leak (OWASP A05/A07, CWE-798) and cryptography that doesn't actually protect
(OWASP A02).

## Secrets
- **Hardcoded (CWE-798):** API keys, passwords, private keys, tokens in source / config / CI. `Grep` for
  `api[_-]?key`, `secret`, `password\s*=`, `BEGIN (RSA|EC|OPENSSH) PRIVATE KEY`, `AKIA[0-9A-Z]{16}`,
  `xox[baprs]-`, `ghp_`, `sk_live_`-style prefixes, and high-entropy strings.
- **In git history:** a secret deleted from HEAD may still live in history —
  `git log -p -S'<token>'` / `git grep '<pattern>' $(git rev-list --all)`. Flag for **rotation**, not just deletion.
- **In logs / errors / responses:** `Grep` for logging/printing of tokens, passwords, full request bodies,
  stack traces with secrets, or secrets in URLs/query strings (which end up in access logs and proxies).
- Secrets must come from env / a secret manager; `.env` gitignored; only `.env.example` committed.

## Cryptography
- **Hashing:** passwords → bcrypt/scrypt/argon2 (never fast hashes); integrity → SHA-256+. md5/sha1 for
  security = CWE-327/916.
- **Symmetric:** AES-GCM or another authenticated mode — flag ECB (CWE-327), static/zero IV or nonce reuse
  (CWE-329), hardcoded keys, key == IV.
- **Randomness:** security tokens / ids / keys from a CSPRNG (`crypto`/`secrets`/`crypto/rand`) — flag
  `Math.random()`, `rand()`, `random.random()` for anything security-relevant (CWE-338).
- **Transit / at rest:** TLS enforced (no plaintext creds/PII over http); sensitive data encrypted at rest
  where required.
- **Don't roll your own:** flag custom crypto / homemade token schemes.

## Output
`path:line` (and the git ref for history hits) · CWE · severity (Critical for a live leaked key or a
forgeable token) · evidence · fix (rotate + move to a secret store; swap to the correct primitive). Coverage note.

> When you find a real secret, tell the user to **rotate** it — never print the full secret value back.
