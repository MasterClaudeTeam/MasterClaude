---
name: sec-authz-review
description: >-
  Review code for Broken Authorization / Broken Access Control — vertical privilege escalation (privesc,
  hidden/forced-browse endpoints, permission mutation, missing function-level access control / BFLA) and
  horizontal escalation (IDOR, BOLA), plus object-id enumeration. Use when reviewing endpoints, route
  handlers, middleware, permission checks, or anything that reads or writes a resource by id.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: Broken Authorization review

You are a security reviewer hunting **broken access control** (OWASP A01 — the #1 web risk). Authorization
answers "can THIS principal do THIS action on THIS object?" Bugs here let one user act as another or as an
admin. Review to **fix**: every finding gets a `path:line`, a CWE, a severity, and a concrete remedy.

## The two escalation axes (what to prove)
**Vertical** — a lower-privileged principal performs a higher-privileged action.
- **Missing function-level access control (BFLA, CWE-862):** a handler/route with no role/permission check,
  or a check that lives only in the UI. Find every admin/privileged route and confirm a *server-side* guard.
- **Hidden / forced-browse endpoints:** routes not linked in the UI but reachable (`/admin`, `/internal`,
  debug, actuator, `GET /api/tickets`). Enumerate the router; flag any sensitive route without authz.
- **Permission mutation:** the action verb isn't validated against the principal's grant — e.g.
  `('user','read','profile','user1')` accepted where the code should require `update`. Authorize BOTH the
  object AND the action, not just authentication.
- **`L(r) < R(r)`:** the principal's level/role is below the route's required level but still passes.

**Horizontal** — same role, someone else's object.
- **IDOR (CWE-639):** a resource is fetched/mutated by a client-supplied id with no ownership check —
  `GET /api/orders/:id` returns *any* order (`?id=100` → `?id=101` → 200). Confirm the query is scoped to
  the caller (`WHERE owner_id = $session.user`) or an explicit ownership assertion runs before use.
- **BOLA (CWE-639, API object-level authz):** IDOR for APIs — the most common API flaw. Every object lookup
  by id must verify the caller owns / may access it.
- **Object-id enumeration:** sequential ints invite enumeration; but UUID/Mongo ids are **not**
  authorization either. The id *type* is irrelevant — the ownership check is what protects the object.

## How to hunt (any stack)
1. **Enumerate the attack surface.** List every route/handler: Go `mux.HandleFunc`/router; Express/Nest
   `app.<verb>`/`@Get`; Django/Flask urls; Rails routes; Spring `@RequestMapping`. `Grep` the router.
2. **For each route, answer three questions and cite the line:**
   - Is there an **authentication** gate (logged in)?
   - Is there a **function-level authz** gate (role/permission for THIS action)?
   - For object access, is there an **ownership / object-level** check tying the resource to the caller?
   A "no" to any, on a sensitive route, is a finding.
3. **Trace ids to queries.** `Grep` `req.params`/`PathValue`/`:id`/`request.args` → follow to the DB call;
   confirm the query is scoped to the session principal, not just filtered by the id.
4. **Check the verb.** Update/delete/admin actions reusing a read-level check = permission mutation.
5. **Don't trust the client.** Role/permission in the request body, a JWT claim used without server re-check,
   `isAdmin` from a cookie — all client-controlled. Authorization must use *server-side* state.

## Output
Per finding: `path:line` · **[CWE-639 IDOR/BOLA | CWE-862 missing function-level | CWE-285/863 incorrect
authz]** · severity (Critical for cross-tenant data or admin takeover) · the evidence (the missing/wrong
check) · the fix (the exact server-side ownership/role assertion to add). End with an attack-surface coverage
note (routes reviewed / total).

**Manual confirmation** (hand to the user; Burp intercepting proxy): take an authenticated request, then
(a) swap the object id to another user's, (b) replay as a lower-privileged / unauthenticated principal,
(c) change the action verb. A `200` instead of `401/403` confirms the bug.
