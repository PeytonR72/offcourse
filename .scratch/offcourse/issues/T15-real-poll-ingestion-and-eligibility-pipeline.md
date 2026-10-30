# T15: Real poll ingestion and eligibility pipeline

Status: ready-for-agent
Blocked by: T04, T08, T09
Execution: Authorized by the user's `/implement ticket 15 auto accept seams tests`
command on 2026-10-30. T04, T08, T09 complete. Seams and tests automatically approved.
Completion: Complete.

## What to build

Server schema/migrations; anonymous consented vote intake or sourced distributions, editorial moderation and min-sample verification, immutable published snapshots; daily manifest publication. Keep simulated data confined to demo mode.

## Tests and acceptance

- [x] cannot publish under threshold; percentages derived correctly; locked version immutable; attribution exists; invalid submissions/rate limits rejected.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Implementation limited to T15. Review baseline:
  `7318299c6631529d133df3a8e008e6c0fa284b12`.
- Used implement, TDD, codebase-design, code-review, and Vercel backend/Functions
  guidance. Accepted seams: PostgreSQL publication/intake repository, migration
  invariants and runner, HTTP validation, and production-route/demo smoke.
- Red/green evidence: the repository and HTTP tests initially failed for missing
  modules; publication failed before the method existed; snapshot UPDATE resolved
  before the immutable trigger; sourced import and daily publication were absent;
  invalid consent and extra data were accepted before HTTP validation; malformed
  JSON threw and throttling omitted Retry-After before HTTP hardening; the runtime
  role could not vote before the restricted security-definer function; ambiguous
  date text was accepted before strict UTC date-key validation. Each slice passed
  after implementation. Migration tests verify reruns, checksum changes, and rollback.
- PostgreSQL migrations and trusted CLI support moderated first-party polls,
  consented unique votes, source counts/citation/permission/verification, a 100
  response floor, derived decimal percentages, immutable versioned snapshots,
  and an immutable ordered Daily Five per UTC date. Simulated content is rejected
  by this schema; existing demo content/selectors remain unchanged.
- POST vote intake requires explicit versioned consent and a random installation
  UUID, HMACs the ID, rejects extra fields/oversized bodies/cross-origin requests,
  deduplicates and throttles in PostgreSQL, and returns no answer values. Runtime
  database roles can be limited to the vote function. Intake is disabled unless
  explicitly enabled with database and hashing-secret configuration; no services,
  live data, live collection, public ranked play, or T16 integration were enabled.
- Targeted verification: `npm test -- src/server` passes 19 checks using PGlite's
  PostgreSQL engine. Docker's local engine is unavailable; no hosted multi-process
  PostgreSQL or provider configuration claim is made. See `docs/poll-pipeline.md`
  for setup, editorial/qualification policy, consent, privacy, and limitations.
- Full verification passed: `npm test` (156 tests across 21 files),
  `npm run lint`, `npm run typecheck`, `npm run format:check`, and
  `npm run build`. All game pages remain static; only the opt-in vote route is
  dynamic. `npm run polls` also verified Node 22 CLI startup/help without secrets.
- `npm run test:e2e` passed **76 browser tests**, with six expected device-specific
  skips, across desktop/mobile Chromium against the production build (2.8 minutes).
  This includes disabled intake/no-store/no answer-reading route, practice/daily/
  endless journeys, reload/storage/reduced motion, keyboard/touch, screenshot,
  viewport and performance smoke checks. Generated evidence is in ignored
  `test-results/` and `playwright-report/`; no product visuals changed.
- Delivery commit reference: `:/^T15: add real poll ingestion and eligibility pipeline$`
  on `main`, under the workflow's automatic normal-commit/push authorization.
  Only the example environment file is included; no actual credentials, live data,
  database provisioning, or migration against a hosted environment was performed.
- Next unlocked ticket: **T16 — Server-backed play manifests and anti-spoiler flow**.
  T17 remains dependent on T16; no later ticket is authorized. Stop after T15.

## Standards

Independent fresh-context reviewer: no actionable findings. The implementation
follows documented credential isolation, dependency injection, repository/HTTP
test seams, and ticket scope. Database permission/immutability tests exercise the
database contract; the outage stub is at the database seam. No Fowler baseline
heuristic warranted a change. Final workflow verification was pending at review.

## Spec

Independent fresh-context reviewer: no actionable findings. T15 implements
moderated consented intake and sourced distributions, the 100-response floor,
derived percentages/attribution, immutable versioned snapshots, and ordered
immutable Daily Five manifests. Question locks protect intake/publication and
version allocation. HTTP consent, hashed IDs, extra-field rejection, persistent
throttling, and answer-free acknowledgments match the ticket. Intake defaults off,
demo gameplay remains labeled, and T16/T17 integration is deferred. Hosted
multi-process PostgreSQL verification remains an acknowledged environment limit.

Review total: **Standards: 0 findings; Spec: 0 findings.** No worst issue on either
axis. Both reviewers compared the staged T15 diff to the fixed baseline above.
