---
name: sec-headers-config
description: >-
  Review security headers and runtime hardening — HSTS, CSP, X-Frame-Options/frame-ancestors,
  X-Content-Type-Options, Referrer-Policy, secure cookie flags, TLS config, verbose error/stack-trace leaks,
  debug endpoints, and directory listing. Use when reviewing server/middleware config, response headers, or a
  deployment's hardening.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: headers & hardening review

The cheap, high-leverage layer (OWASP A05) — correct headers and config defang whole bug classes.

## What to check
- **Transport.** `Strict-Transport-Security` (HSTS) set; HTTP→HTTPS redirect; modern TLS only (no TLS < 1.2,
  no weak ciphers). No secrets / PII over plaintext.
- **Headers.** `Content-Security-Policy` (meaningful), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options` / CSP `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`. `Grep` the
  middleware/server config; flag missing or weak (`unsafe-inline`, `*`).
- **Cookies.** `Secure`, `HttpOnly`, `SameSite` on session/auth cookies. (Cross-check `sec-authn-session`.)
- **Error handling / info leak (CWE-209).** Stack traces, framework banners, internal paths, or DB errors in
  prod responses. Generic errors to clients; details to logs.
- **Debug & dev surface.** Debug mode on in prod, profiler / actuator / `/debug` endpoints, GraphQL
  playground/introspection, directory listing, exposed source maps, default credentials.
- **Defaults.** Verbose `Server` / `X-Powered-By` headers; permissive defaults left unchanged.

## Output
`path:line` (or the missing config) · CWE-16/209/319/… · severity · evidence · fix (the exact header/setting).
Coverage note. A header scan (`securityheaders.com` / `testssl.sh`) complements this for live checks.
