---
name: sec-threat-model
description: >-
  Build a STRIDE threat model for a feature, service, or system — identify assets, entry points, trust
  boundaries and data flows, enumerate threats (Spoofing, Tampering, Repudiation, Information disclosure,
  Denial of service, Elevation of privilege), and propose mitigations with residual risk. Use when designing
  or reviewing the security of a feature or architecture, not a specific diff.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: threat modeling (STRIDE)

Find the risks in a design before they're code. Answer the four questions: *What are we building? What can
go wrong? What do we do about it? Did we do a good job?*

## Method
1. **Model the system.** Identify **assets** (data, credentials, money, availability), **entry points** /
   actors, **trust boundaries** (where privilege changes), and the **data flows** between components. Read
   the code/design to ground this — don't invent components.
2. **Enumerate threats with STRIDE**, per element / flow:
   - **S**poofing (identity) — authentication gaps.
   - **T**ampering (integrity) — unvalidated input, mutable data in transit.
   - **R**epudiation — missing / forgeable audit logs.
   - **I**nformation disclosure — secrets, PII, error leaks.
   - **D**enial of service — unbounded work, no rate limits.
   - **E**levation of privilege — broken authz, injection → RCE.
3. **Rate** each (likelihood × impact) and propose a **mitigation** (and which `sec-*` skill confirms it in code).
4. **Residual risk** — what remains after mitigation, and what's accepted.

## Output
A threat table: `element/flow · STRIDE category · threat · likelihood/impact · mitigation · owner skill`,
then the top risks and a short "did we cover it" note. Drives the focused `sec-*` reviews and `wf-security-audit`.
