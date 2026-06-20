---
name: sec-ssrf-traversal
description: >-
  Review for SSRF, path traversal, open redirect, and unrestricted file upload — untrusted input that
  controls a URL the server fetches, a filesystem path, a redirect target, or an uploaded file's type and
  location. Use when reviewing code that fetches URLs, reads/writes files by name, redirects, or handles uploads.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: SSRF, path traversal, open redirect & file upload

Untrusted input that steers where the **server** goes or what it stores. They share a fix shape: validate
against a strict allowlist and resolve/canonicalize before use.

## SSRF (CWE-918)
The server fetches a URL the client influences (webhooks, "fetch this image/url", PDF/screenshot-from-URL,
import-from-URL, metadata lookups). `Grep` outbound calls (`fetch`/`http.Get`/`requests.get`/`axios`/
`urllib`) whose target comes from input.
- Risk: reach internal services and cloud metadata (`169.254.169.254`, `localhost`, RFC-1918, `file://`,
  `gopher://`) and port-scan the internal network.
- Fix: allowlist host + scheme; resolve DNS and block private/link-local ranges (**re-check after
  redirects**); disable unused schemes; never pass a raw user URL to the fetcher.

## Path traversal (CWE-22)
User input becomes part of a filesystem path (`download?file=`, include/template by name, zip extraction —
"zip slip"). `Grep` `readFile`/`open`/`os.ReadFile`/`sendFile`/`path.join` fed by request input.
- Fix: canonicalize (`realpath`) and assert the result stays under an allowed base dir; allowlist names;
  never join raw input.

## Open redirect (CWE-601)
`redirect(req.query.next)` / a `Location` from input → phishing and OAuth token theft. Allowlist redirect
targets (relative paths, or a known host set); never redirect to a raw user-supplied absolute URL.

## File upload (CWE-434)
Validate type by **content** (magic bytes), not extension/`Content-Type`; store **outside the webroot** with
a generated name; cap size; never execute uploaded content; re-encode images. Flag uploads that trust the
client-supplied filename/type or save into a served directory.

## Output
`path:line` · CWE (918 / 22 / 601 / 434) · severity (Critical for SSRF-to-metadata or RCE-via-upload) · the
input → sink trace · the allowlist/canonicalization fix. Coverage note.
