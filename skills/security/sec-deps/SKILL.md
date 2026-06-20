---
name: sec-deps
description: >-
  Review dependency & supply-chain security — known-vulnerable or outdated packages, typosquatted/
  hallucinated names, unpinned or integrity-unverified deps, risky install scripts, and SBOM gaps. Use when a
  dependency is added or updated, or when auditing a lockfile / package manifest. Complements the supplyguard guardrail.
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# Security: dependency & supply-chain review

Most of a project is someone else's code. (OWASP A06 — vulnerable & outdated components.)

## What to check
- **Known vulnerabilities.** Run the ecosystem auditor when available (`npm audit`, `pip-audit`,
  `govulncheck`, `cargo audit`, `bundler-audit`) and read the results; for a flagged package, confirm the
  vulnerable path is reachable. `WebFetch` the advisory (GHSA/CVE) when you need detail.
- **Typosquatting / hallucinated names (CWE-1357).** A new dependency name close to a popular one, or one
  that doesn't exist / has near-zero downloads / is brand-new with odd maintainers. Verify it's the real package.
- **Pinning & integrity.** Lockfile present and committed; versions pinned; integrity hashes present. Flag
  floating ranges on security-sensitive deps and missing lockfiles.
- **Install scripts.** `postinstall` / build scripts in dependencies that run arbitrary code — note risky ones.
- **Maintenance & license.** Unmaintained/abandoned critical deps; a license incompatible with the project.
- **Minimize.** Flag a heavyweight dep pulled in for a trivial need (more surface = more risk).

## Output
`path:line` (manifest/lockfile) · CVE/GHSA + CWE · severity (from the advisory + reachability) · evidence ·
fix (upgrade to the patched version / replace / pin / remove). Coverage note.
