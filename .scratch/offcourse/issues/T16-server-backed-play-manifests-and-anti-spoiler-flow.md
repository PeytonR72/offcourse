# T16: Server-backed play manifests and anti-spoiler flow

Status: ready-for-agent
Blocked by: T15
Execution: Authorized by the user's `/implement ticket 16, auto accept tests seams`
command on 2026-10-30. T15 complete. Seams and tests automatically approved.
Completion: Complete.

## What to build

Securely fetch question manifests without answer values before lock; server validates locked guess and returns official distribution version, tracks best-effort anonymous installation participation; fail safely on disconnect.

## Tests and acceptance

- [x] endpoints don’t leak answers pre-lock; replay/idempotency; request throttling; server recomputes scores; frozen answer remains fixed mid-run; offline interruption handled.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Scope limited to T16. Review baseline: `40b025dcceb55f239015655a6cb35b2421182c52`.
  Used implement, TDD, codebase-design, code-review, and the relevant Vercel
  backend, Functions, React, and verification guidance. Accepted seams: PostgreSQL
  play repository, HTTP handlers, and browser input/disconnect recovery.
- Red/green evidence: safe-manifest and lock tests failed for absent interfaces;
  the throttle returned unavailable instead of rate_limited before implementation;
  UTC rollover reopened yesterday's completed attempt before server-date handling;
  conflicting-tab recovery stayed pending before returning the earned official
  record. Targeted tests passed after each implementation/fix.
- Migration `002-play.sql` adds persistent participation, shared limits, and
  immutable round results. Runs pin published snapshot IDs; the public manifest
  contains safe question fields/version only. Locked targets and scores are loaded
  server-side using the existing centralized `scoreRound`, then saved atomically
  with the run totals. Identical retries do not credit twice; changed/out-of-order
  predictions cannot replace a lock or earn a future answer. Anonymous HMAC keys
  and best-effort daily uniqueness persist across instances; raw IDs/IPs and
  fingerprints are not stored. Throttling covers start/lock, retries, and unknown runs.
- `/play` (daily) and `/play?mode=endless` provide opt-in server-backed previews,
  reusing the current accessible controls, rocket, flight, pause, and reduced motion.
  Drafts survive reload. Pending input is durably saved before sending; lost
  responses hold the same payload and show no result until server confirmation.
  Storage failure prevents sending. Stale tabs recover the official earned record.
  Samples/attribution appear with results. Choices are not added to poll intake.
- Server-backed play is **disabled by default**, with separate server credentials
  and hashing secret. No hosted service, production migration, live collection,
  real data sourcing, or public launch was enabled. Main demo modes and their
  illustrative-data disclosures remain intact. Setup, role grants, contracts,
  privacy limitations, and verification are in `docs/server-play.md`.
- Final checks passed: `npm test` (**169 tests / 23 files**), `npm run lint`,
  `npm run typecheck`, `npm run format:check`, and `npm run build`.
  Targeted `npm test -- src/server/play.test.ts src/app/play/server-play.test.tsx`
  covers nine repository/HTTP checks plus four browser recovery checks.
- `npm run test:e2e:server` passed **6 tests** against the production Next.js app,
  the real pg transaction adapter, a restricted server database role, and an
  isolated local PostgreSQL 18 cluster. Desktop/mobile checks cover hidden targets,
  five-round official scoring, daily replay, genuine concurrent requests,
  cross-installation isolation, and a committed lock whose response is lost before
  reload/retry. Only conspicuously synthetic fixtures were seeded. The temporary
  loopback cluster was stopped and removed; no hosted database was touched.
- `npm run test:e2e` passed **78 tests** (2.8 minutes), with 12 expected skips:
  six device-specific duplicates and the six configured-backend checks executed
  separately above. This covers disabled/no-store/no-answer-reading endpoints,
  demo journeys, reload, keyboard/touch, reduced motion, screenshots, viewports,
  and existing performance smoke. No physical-device performance claim is made.
- Reviewed all six retained screenshots in `docs/evidence/t16/`: mobile/desktop
  aiming, offline-held prediction, and completed daily. Layout, readable controls,
  frozen pending input, and source/fixture disclosures are visible. Other traces,
  reports, and screenshots remain in ignored test output directories.
- Delivery commit reference:
  `:/^T16: add server-backed play manifests and anti-spoiler flow$` on `main`,
  under the workflow's authorized normal commit/push to the private repository.
  The example environment file contains no credentials; build output, temporary
  databases, local settings, dependencies, and secrets are excluded.
- Next unlocked ticket: **T17 — Publishable daily & endless content strategy**.
  T18 remains dependent on T17. Stop after T16.

## Standards

Independent fresh-context review initially found two documented-standard issues
and one duplication concern. Fixed them: rollover IDs use an injected factory
asserted deterministically; the outage test uses the real repository with a
failing database transaction seam; shared pure identity/prediction validators
serve HTTP and local recovery. Client state updaters remain pure and presentation
does not reveal aggregate score/completion early. The follow-up review reports
**no residual actionable Standards findings**.

## Spec

Independent fresh-context review and follow-up found **no actionable findings**:
no missing/partial T16 requirements, scope creep, or incorrect implementation
in answer secrecy, server scoring, frozen versions, atomic participation/locking,
throttling, and disconnect recovery. T17 content transition and T18 launch remain
gated.

Final review total: **Standards: 0 residual findings; Spec: 0 findings.**
No worst issue on either axis after fixes. Reviews compared the staged T16 diff
to the fixed baseline above before committing.
