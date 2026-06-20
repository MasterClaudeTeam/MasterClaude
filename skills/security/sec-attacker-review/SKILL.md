---
name: sec-attacker-review
description: >-
  Review code from an attacker's perspective — map the attack surface, trace untrusted input from source to
  sink across trust boundaries, and enumerate abuse cases for each entry point. Use at the start of a
  security review, on a new feature/PR, or whenever you want a threat-led pass over code rather than a
  checklist.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: code review from an attacker's perspective

Don't read code top-to-bottom like the author. Read it like an attacker: *"where does untrusted data enter,
where does it end up, and what breaks on the way?"* This lens finds the real bugs; the specific checklists
(`sec-authz-review`, `sec-injection`, …) confirm what it surfaces.

## 1. Map the attack surface (sources)
List everywhere untrusted data enters: HTTP routes / params / body / headers / cookies, file uploads,
webhooks, message queues, CLI args, environment, deserialization, and 3rd-party / DB responses you re-trust.
`Grep` the router plus `req.`/`request.`/`os.Getenv`/`Unmarshal`/`JSON.parse`. These are your **sources**.

## 2. Identify trust boundaries
Where does data cross from less-trusted to more-trusted? client→server, service→service, user→DB,
app→shell / filesystem / template / browser. Validation and authorization must happen **at the boundary,
server-side**. Note every boundary the data crosses.

## 3. Trace source → sink
For each source, follow the data to its **sinks** (where it becomes dangerous): a SQL/NoSQL query,
shell/exec, HTML/template render, filesystem path, outbound HTTP (SSRF), redirect, eval/deserialize, or an
authorization decision. Untrusted data reaching a sink without validation / encoding / parameterization is a
finding. This is the core loop — run it per entry point.

## 4. Enumerate abuse cases per entry point
Ask, for each: What if I send too much / negative / unicode / null bytes? Someone else's id? A role I don't
have? A path with `../`? A URL pointing at `169.254.169.254`? The same request 1000×/s? An expired or forged
token? Each "what if" with no defense is a candidate finding — confirm with the matching `sec-*` skill.

## 5. Think in attacker goals
Tie findings to impact: read others' data (IDOR/BOLA), become admin (privesc), run code (injection/deser),
reach internal services (SSRF), steal secrets, deny service. Severity follows the goal reached.

## Output
A short **threat map** — entry points → trust boundaries crossed → sinks reached → abuse cases — then the
concrete findings (`path:line`, CWE, severity, fix) the trace surfaced. Route the specific confirmations to
`sec-authz-review` / `sec-injection` / `sec-authn-session` / `sec-secrets-crypto` / `sec-ssrf-traversal`. Be
honest about coverage: which entry points you traced fully vs sampled.
