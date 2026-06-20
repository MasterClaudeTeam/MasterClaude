---
name: sec-frontend
description: >-
  Review front-end / client-side security — XSS sinks, Content-Security-Policy, CSRF, clickjacking, CORS
  misconfiguration, postMessage origin checks, client-side secrets, and prototype pollution. Use when
  reviewing browser code, React/Vue/Svelte components, or anything that renders untrusted data or calls an
  API from the client.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: front-end / client-side review

The browser is hostile: client code is visible and tamperable, and any untrusted data rendered there can run
as script. (OWASP A03/A05/A07.)

## What to check
- **XSS sinks (CWE-79).** `Grep` `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `document.write`,
  `insertAdjacentHTML`, `.html(`, `eval`, `new Function`. Any fed by user / URL / API data → finding. Prefer
  text APIs / framework escaping; sanitize with a vetted library if rich HTML is required.
- **DOM-based XSS.** Sinks fed from `location` / `document.referrer` / `window.name` / `postMessage`.
- **CSP.** Is a meaningful `Content-Security-Policy` set (no `unsafe-inline` / `unsafe-eval`, no `*`)? A
  strong CSP is the backstop for XSS.
- **CSRF (CWE-352).** State-changing requests need protection (SameSite cookies + token, or no ambient
  cookie auth). Flag cookie-authenticated POST/PUT/DELETE without it.
- **Clickjacking (CWE-1021).** `X-Frame-Options: DENY` / CSP `frame-ancestors` on sensitive pages.
- **CORS (CWE-942).** `Access-Control-Allow-Origin` must not reflect arbitrary origins or use `*` with
  credentials. Flag origin-reflection + `Allow-Credentials: true`.
- **postMessage.** A `message` listener must check `event.origin`; `postMessage` should target a specific
  origin, not `*`, for sensitive data.
- **Client-side secrets.** No secret keys in the bundle (public/anon keys are fine; secret keys are not).
- **Prototype pollution (CWE-1321).** Recursive merge / `set` from untrusted input touching `__proto__`.

## Output
`path:line` · CWE · severity · evidence · fix (the encoding / header / origin check). Coverage note.
