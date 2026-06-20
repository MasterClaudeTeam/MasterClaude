---
name: sec-injection
description: >-
  Hunt injection flaws — SQL/NoSQL injection, OS command injection, XSS (stored/reflected/DOM), SSTI, XXE,
  LDAP and header/log injection. Use when reviewing code that builds queries, runs commands, renders
  templates/HTML, parses XML, or otherwise mixes untrusted input into an interpreter.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: injection review

Injection (OWASP A03, the CWE-74 family) happens when untrusted data is interpreted as code/commands by a
downstream interpreter. The fix is almost always the same shape: **separate code from data** (parameterize /
escape / use a safe API) — never string-concatenate untrusted input into an interpreter.

## By interpreter (find the sink, check the input)
- **SQL (CWE-89).** Sink: a query built by concatenation / format / f-string / template literal. `Grep`
  `"SELECT ... " +`, `fmt.Sprintf("...%s...")` in queries, `query(\`...${ }\`)`, `.raw(`, `.execute(`. Safe =
  parameterized / prepared statements / query-builder bindings. Flag any user value inside the SQL string.
- **NoSQL (CWE-943).** Mongo `$where`, operator injection (`$ne`/`$gt`) from JSON bodies, `find(req.body)`.
  Flag query objects built from raw request input without a schema.
- **OS command (CWE-78).** Sink: `exec`/`system`/`child_process.exec`/`os/exec` with a shell/`subprocess
  shell=True`/backticks. `Grep` these; flag any with concatenated input. Safe = arg arrays, no shell, strict allowlist.
- **XSS (CWE-79).** Sinks: `innerHTML`, `dangerouslySetInnerHTML`, `document.write`, `v-html`, unescaped
  template output (`{!! !!}`, `| safe`, Go `text/template` used for HTML). Reflected (echoed), stored
  (persisted then rendered), DOM (sink fed from `location`/`document`). Safe = contextual output encoding +
  framework auto-escaping + CSP.
- **SSTI (CWE-1336).** User input concatenated into a server template (`render_template_string`, Jinja/
  Handlebars/EJS built from input). Flag template strings assembled from input.
- **XXE (CWE-611).** XML parser with external entities/DTD enabled. `Grep` the parser setup; require them disabled.
- **LDAP / header / log injection.** Input into LDAP filters, HTTP response headers (CRLF → response
  splitting), or log lines (forged entries, log4shell-style `${}` lookups). Flag unsanitized input into these.

## Method
1. Reuse the source→sink trace (`sec-attacker-review`): for each untrusted source, find which interpreter it reaches.
2. At each sink, decide: is the input parameterized / escaped / allowlisted **for that context**? If not → finding.
3. Watch for **second-order**: input stored now, concatenated into a sink later.

## Output
`path:line` · CWE (89 / 78 / 79 / 943 / 1336 / 611 / …) · severity (Critical for SQLi/RCE, High for stored
XSS) · the tainted source → sink trace · the fix (the exact safe API / encoding for that sink). Coverage note.
