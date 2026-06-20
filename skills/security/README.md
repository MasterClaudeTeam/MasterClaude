# security/ — review projects for vulnerabilities, front to back

Defensive security-review skills: **find vulnerabilities so you can fix them**, mapped to OWASP Top 10 +
CWE, with `path:line` evidence and a concrete remedy. The leader pulls the right one when code touches a
sensitive area; `wf-security-audit` runs the whole set; the `security-auditor` agent writes a tracked report
under `.security/`. These are review methodologies, not attack tooling.

**Current members**
- `sec-authz-review` — Broken Authorization: vertical privesc + horizontal IDOR/BOLA, object-id enumeration.
- `sec-attacker-review` — code review from an attacker's perspective (attack surface → source/sink → abuse cases).
- `sec-injection` — SQL/NoSQL, command, XSS, SSTI, XXE, LDAP, header/log injection.
- `sec-authn-session` — auth/session/JWT: credentials, fixation, JWT flaws, MFA, enumeration, reset.
- `sec-secrets-crypto` — hardcoded secrets, secrets in logs/history, weak/misused crypto, insecure randomness.
- `sec-ssrf-traversal` — SSRF, path traversal, open redirect, unrestricted file upload.
- `sec-frontend` — client-side: XSS sinks, CSP, CSRF, clickjacking, CORS, postMessage, client-side secrets.
- `sec-api` — REST/GraphQL: BOLA/BFLA, mass assignment, excessive data exposure, rate limits, GraphQL depth.
- `sec-deps` — vulnerable / outdated / typosquatted dependencies, lockfile integrity, CVE checks.
- `sec-iac-cloud` — Docker/K8s/Terraform/cloud misconfig (root containers, public buckets, open IAM/SGs).
- `sec-threat-model` — a STRIDE threat model of a feature or system (design-time).
- `sec-headers-config` — security headers, cookie flags, TLS, error/info leak, debug surface.

**Brainstorm — what else belongs here** (great contributions)
- Further: `sec-deserialization`, `sec-pii-privacy`, `sec-logging-monitoring`, `sec-mobile`,
  `sec-llm` (prompt injection / insecure tool use), and stack-specific gates (`go-sec`, `node-sec`, `python-sec`).

**Add one:** `skills/security/<id>/SKILL.md` with frontmatter (`name`, a trigger-focused `description`,
`allowed-tools`). Keep it **defensive** (review-to-fix), OWASP/CWE-mapped, with `path:line` output. See
[CONTRIBUTING](../../CONTRIBUTING.md) and [docs/ADDING-A-CAPABILITY.md](../../docs/ADDING-A-CAPABILITY.md).
