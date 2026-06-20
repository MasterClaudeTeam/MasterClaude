---
name: sec-authn-session
description: >-
  Review authentication, session, and JWT handling — weak credential policy, session fixation/rotation, JWT
  algorithm/secret/claim flaws, MFA bypass, account enumeration, and insecure password-reset flows. Use when
  reviewing login, signup, logout, session/cookie, token, or password-reset code.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: authentication & session review

Authentication failures (OWASP A07) let an attacker become someone else. Review the full identity lifecycle:
login → session → token → reset → logout.

## What to check
**Credentials & storage**
- Passwords hashed with a slow, salted KDF — **bcrypt / scrypt / argon2**, not md5/sha1/plain-sha256
  (CWE-916). `Grep` the hashing call.
- Rate-limiting + lockout on login (CWE-307 brute force); a real password policy where it matters.

**Sessions**
- Session id **regenerated on login** (no fixation, CWE-384); invalidated on logout AND password change
  (CWE-613).
- Cookies: `HttpOnly`, `Secure`, `SameSite`; sane absolute + idle timeout. `Grep` the cookie setup.

**JWT (CWE-347)**
- Algorithm pinned server-side; reject `alg: none` and HS/RS alg-confusion. `Grep` `verify(`/`decode(` —
  flag `decode` without `verify`, a missing `algorithms:` allowlist, or a hardcoded/weak secret.
- `exp`/`nbf`/`aud`/`iss` validated; client-set claims (`role`, `isAdmin`) re-checked server-side, never trusted.
- No sensitive data in the (unencrypted) payload.

**Flows**
- **Account enumeration (CWE-203):** login / reset / signup must not reveal whether an account exists —
  uniform messages and timing.
- **Password reset:** tokens single-use, expiring, unguessable, bound to the account; no host-header
  poisoning in reset links.
- **MFA:** enforced server-side on every step it should gate; no "remember device" that silently skips it.

## Method
`Grep` the auth entry points (login / signup / reset / logout / jwt / session), read each end-to-end, and
walk the list above. Route any client-trusted identity/role to `sec-authz-review`.

## Output
`path:line` · CWE · severity (Critical for auth bypass or token forgery) · evidence · fix. Coverage note.
