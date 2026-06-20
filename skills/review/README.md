# review/ — critique the diff and the design

Skills here put a skeptical second pair of eyes on the work before it ships.

**Current members**
- `cap-self-review` — an unsentimental pass over your own diff before you push.
- `cap-red-team` — adversarial pre-mortem: the likeliest failure modes and the cheapest way to de-risk them.

**Brainstorm — what else belongs here** (great first contributions)
- `security-review` — OWASP-style pass over a diff (authz, injection, secrets, SSRF…).
- `perf-review` — flag N+1s, hot-path allocations, and accidental O(n²).
- `a11y-review` — accessibility pass for frontend diffs.
- `api-breaking-change-detector` — catch backwards-incompatible API/schema changes.
- `pr-description-writer` — turn a diff into a clear PR description with risk notes.
- **Stack-flavored variants:** `react-render-review`, `go-concurrency-review`, `sql-query-review`,
  `terraform-plan-review`.

**Add one:** create `skills/review/<your-skill>/SKILL.md`. See [CONTRIBUTING](../../CONTRIBUTING.md).
