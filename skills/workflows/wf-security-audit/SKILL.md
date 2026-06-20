---
name: wf-security-audit
description: >-
  Run a full, front-to-back security audit of a repository — map the attack surface, then review every layer
  (authorization, injection, auth/session, secrets & crypto, SSRF/traversal, and config) and produce a
  prioritized remediation report mapped to the OWASP Top 10 and CWE, with an honest coverage statement. Use
  when you want a comprehensive security review of a project, not a single-area check.
allowed-tools: Read, Grep, Glob, Bash
---

# Workflow: full project security audit

Drive a rigorous, multi-pass security review of the whole repository and report every vulnerability with a
concrete fix. This is the comprehensive service; for one area, use the focused `sec-*` skill instead.

**Scope:** the security-relevant code across the stack — front end, back end, APIs, and infra/config. Work in
passes for a large repo and keep a coverage ledger of what's reviewed in full vs sampled vs skipped. Be
defensive throughout (review-to-fix; never exploit live systems).

## Passes
1. **Attack surface.** Enumerate entry points (routes/handlers, input parsing, uploads, webhooks,
   deserialization, env/config, IaC) and trust boundaries. This frames everything.
2. **Authorization** — `sec-authz-review`: per route, confirm authn + function-level authz + object-level
   ownership; hunt IDOR/BOLA/privesc/BFLA and object-id enumeration.
3. **Injection** — `sec-injection`: trace untrusted input into every interpreter (SQL/NoSQL/cmd/HTML/
   template/XML/LDAP); confirm parameterization/encoding.
4. **Authentication & session** — `sec-authn-session`: credentials, sessions, JWT, MFA, reset, enumeration.
5. **Secrets & crypto** — `sec-secrets-crypto`: hardcoded secrets (incl. git history), secrets in logs,
   weak/misused crypto, insecure randomness.
6. **SSRF / traversal / upload / redirect** — `sec-ssrf-traversal`.
7. **Config & hygiene** — security headers, cookie flags, TLS, debug endpoints, error/info leak; dependency
   and IaC hygiene (go deeper with `sec-deps` / `sec-iac-cloud` when present).

## Output
For each issue, one line:

    path:line  [severity]  OWASP-Axx / CWE-nnn  finding  ->  concrete fix

Then:
1. A **prioritized remediation plan** grouped by severity (Critical / High / Medium / Low), each item linking
   back to its `path:line`, ordered by exploitability × impact.
2. An **OWASP Top 10 coverage matrix** (which categories were checked and what was found).
3. A **coverage statement**: files/areas reviewed in full vs sampled vs skipped, so completeness is auditable.

Mark anything you couldn't fully verify rather than asserting it's safe. If the `security-auditor` agent is
available, drive it to persist findings under `.security/`.
