---
name: sec-api
description: >-
  Review API security (REST & GraphQL) — broken object/function level authorization (BOLA/BFLA), mass
  assignment, excessive data exposure, missing rate-limiting / resource limits, weak input validation, and
  GraphQL introspection/depth/batching. Use when reviewing API endpoints, controllers, resolvers, or serializers.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: API review (OWASP API Top 10)

APIs leak and break differently from page apps — the top risks are authorization and over-exposure.

## What to check
- **BOLA / object-level authz (API1, CWE-639).** Every endpoint taking an object id must verify the caller
  may access THAT object — not just that they're authenticated. (Deep-dive: `sec-authz-review`.)
- **BFLA / function-level authz (API5).** Admin/privileged operations gated server-side, not by UI or obscurity.
- **Mass assignment (CWE-915).** Binding the whole body to a model (`update(req.body)`, `Model(**data)`) lets
  a client set fields it shouldn't (`is_admin`, `role`, `owner_id`). Flag bulk binds; require an explicit
  allowlist of writable fields.
- **Excessive data exposure (API3).** Responses returning whole objects (password hashes, internal flags,
  other users' PII). Return a minimal, explicit shape.
- **Rate-limiting & resource limits (API4, CWE-770).** Throttle auth/login/expensive endpoints; paginate list
  endpoints with a max page size; cap upload sizes.
- **Input validation.** Validate type/shape/range at the boundary (a schema). Flag handlers that trust the JSON shape.
- **GraphQL.** Disable introspection in prod; enforce query depth/complexity limits; watch aliasing/batching
  amplification; apply object-level authz in resolvers, not just at the gateway.

## Output
`path:line` · OWASP-APIx / CWE · severity · evidence · fix. Coverage note (endpoints / resolvers reviewed).
