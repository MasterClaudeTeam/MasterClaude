---
name: wf-codebase-audit
description: "Reviews a repository line by line and reports every gap, bug, and risk as path:line findings, with a prioritized fix plan grouped by severity and a coverage statement."
---

# Line-by-line Codebase Audit

Run a rigorous, line-by-line audit of the target repository and report every gap, bug, and risk with a concrete fix.

**Scope:** read every source file in full — do not skim, sample, or skip. For a large repo, work in passes and keep a checklist of which files are fully read.

For each issue, output one line:

    path:line  [BUG|SECURITY|EDGE|PERF|TEST|TYPE|DOCS]  finding  ->  concrete fix

Cite the exact line, say why it is wrong, and give the actual fix (never "consider improving"). Look hardest for:

- unchecked errors and nil/null dereferences
- missing input validation and injection vectors
- auth and access-control gaps
- race conditions and resource leaks
- off-by-one and boundary cases
- missing or wrong tests

Then produce:

1. A prioritized remediation plan grouped by severity (Critical / High / Medium / Low), each item linking back to its `path:line` findings.
2. A coverage statement listing which files were read in full vs sampled vs skipped, so the audit's completeness is auditable.

Be honest about uncertainty: mark anything you could not fully verify instead of asserting it is fine.
