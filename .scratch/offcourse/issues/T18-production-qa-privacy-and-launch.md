# T18: Production QA, privacy, and launch

Status: ready-for-human
Blocked by: T10–T17
Execution: Authorized by `/implement ticket 18 auto accept tests seams` on
2026-10-30. T10–T17 complete. Seams and tests automatically approved.
Completion: Software implementation delivered. Ticket acceptance remains open
for physical-phone profiling and screen-reader QA; the deployed game remains
demo-only. Genuine-crowd release requires separate explicit approval.

## What to build

Device profiling, accessibility audit, performance fixes, basic privacy/storage notice, production monitoring without invasive fingerprinting, deployment, fallback and rollback.

## Tests and acceptance

- [ ] CI clean; E2E mobile + desktop across both modes; real answers never arrive before lock; verified sample sizes; 60fps target measured on test device, report actual; production smoke after deploy.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Fixed review baseline: `c8a21480ba2a0abece0b53e2c7e2f165aeb45125`.
- Scope: shared privacy/storage notice, answer-free readiness monitoring,
  unexpected-error recovery, accessibility audit/fixes, renderer paint reduction,
  reproducible device-cadence profiling, CI backend coverage, demo deployment and
  production smoke, fallback/rollback runbook. No live content or paid service.
- Red/green: missing privacy page and recovery screen; missing health response;
  health incorrectly returned 200 for requested but unconfigured server play;
  axe found preference label/name mismatch; fallback SVG painted while canvas
  was active. Each passes after implementation. Browser context loss restores
  the current SVG prediction without restarting gameplay.
- Implementation and TDD skills applied; review uses independent Standards and
  Spec agents. Vercel deployment and React review guidance applied.
- Test seams: public page/controls and scene behavior, operational HTTP response,
  and existing server-play HTTP/repository interfaces. Database errors are
  simulated at the external probe seam; configured HTTP coverage uses a real
  isolated PostgreSQL cluster and restricted play role.
- Final full browser suite: `npm run test:e2e` **84 passed / 16 expected skips**
  (six device-specific duplicates and ten configured-backend checks run
  separately). This includes 22 automated axe audits across aiming, pause,
  results, privacy and unavailable-server states, keyboard/touch, saved locks,
  overflow/touch targets, reduced motion and forced GPU failure/context loss.
- `npm run test:e2e:server`: **10 passed** against an isolated PostgreSQL 18
  cluster, restricted play role, 100 synthetic qualified fixture questions and
  eight daily manifests. Covers earned sample size/attribution, pre-lock secrecy,
  server scores/participation, disconnect/idempotency, concurrent locks,
  cross-installation isolation, content shortage and answer-free readiness.
  Fixtures are not genuine crowd data and never leave the local fixture cluster.
- Format, lint, typecheck and production build pass. Final precommit full Vitest
  suite passed **185 tests / 27 files**, including five separate health scenarios.
  An earlier daily test timeout under competing browser/build load passed both
  targeted and full sequential reruns, with no unrelated gameplay change.
- Performance report and four manually reviewed desktop/mobile screenshots:
  `docs/evidence/t18/`. Final measured desktop rAF cadence **60.0 FPS**; 4× CPU
  mobile emulation **53.2–54.6 FPS**, p95 **33.3–33.4 ms** after skipping hidden
  fallback reconciliation. The earlier paint-only 43.8–46.5 FPS capture remains
  in `profile-paint-only.json`. No phone or GPU-presentation
  FPS claim. Prior T17 hosted CI failed its 4× timing probe and stale screenshots;
  CI now records a 1× responsiveness smoke with unchanged limits, while local
  actual profiling retains 4×. World screenshot masks omit only text overlays;
  both baselines were visually reviewed, with unchanged 1% geometry tolerance.
- `docs/launch-readiness.md` records project identity, health response meanings,
  privacy-aware diagnostics, deployment smoke, backend fallback and rollback.
  No analytics SDK, fingerprint, external error collector, recurring paid
  monitor, live data source or hosted database change is added. Existing Vercel
  request/runtime diagnostics and the on-demand readiness endpoint provide
  monitoring. New backend report directories preserve both CI browser reports.
- Last-known-good rollback candidate before this work:
  `dpl_C75gxU41cJxqiGi1sBvVqnec9wSN`, READY production deployment of baseline
  `c8a2148`, URL `offcourse-hvb7mnb0t-peytonr7272-gmailcoms-projects.vercel.app`.
- Implementation commit **`6fe0ee05423e52930f8e598db9167a518152e588`** pushed
  normally to `main`. Vercel verified exact Git SHA, project and production
  target: **`dpl_E4BcK1pacYv1VBkWd1mstpiwDLe3`**, READY and aliased to
  `https://offcourse-five.vercel.app`. Generated URLs retain deployment protection.
- Production smoke: **14 passed** on desktop/mobile against that deployment,
  using fresh browser-local demo records. Daily 0/500 boundaries, same-day
  replay, endless inclusive 10/11 survival/loss/restart, home/disclosure,
  privacy/audits and disabled answer-free play endpoints all pass. `/api/health`
  returns 200, `Cache-Control: no-store`, `{status: "ok", play: "demo"}`.
  `docs/evidence/t18/production-smoke.json` records scope and remaining gates.
- CLI smoke output exposed Playwright's inherited-server concatenation. Both
  configs now use explicit object overrides: production starts no local app,
  backend starts only port 3101, shared tracing/projects remain. Repeat targeted
  smoke verifies the correction. Independent follow-up reviews report no findings.
- Final delivery CI is tracked by the [main validation runs](https://github.com/PeytonR72/offcourse/actions/workflows/ci.yml).
  This final normal evidence/configuration commit runs the same complete CI
  validation and does not bypass checks. Final CI/deployment results are reported
  to the user after that run finishes.
- Final Linux run `41152054541` passed all format/lint/typecheck/unit/build and
  full browser checks, then exposed PostgreSQL startup failure before any server
  tests. The fixture runner now explicitly disables distro Unix sockets and
  retains loopback TCP on its ephemeral port; this avoids group-owned socket
  directories. Startup failures now retain diagnostic log output too. This
  runner-only correction does not change the deployed app or database schema.
- A repeated local precommit run reproduced the daily UI test's one-second
  result-wait timeout. Its async watchdog now allows three seconds, consistent
  with other flight UI tests; assertions and gameplay are unchanged. This avoids
  treating concurrent test scheduling as an animation-timing requirement.
- Run `41153142468` found hosted frame-time variability while recording DOM
  traces (p95 roughly 133–167 ms even at 1×). Timing probes now disable tracing,
  preserve metric/screenshot artifacts before asserting the same limits, and
  other CI journeys trace on first retry per Playwright's performance guidance.
  No performance budget is relaxed and raw 4× measured results remain unchanged.
- Run `41154239676` confirms all ten backend checks pass on Linux. Desktop
  frame-time still reached p95 100 ms without tracing. The fallback SVG now
  skips hidden geometry reconciliation while Pixi is ready, and renders current
  authoritative children when GPU failure makes it visible. Fourteen focused
  world/art/cadence checks pass, including earned happy-expression recovery
  after landing. Fresh profiling is recorded above; both reviewers report no
  findings in the memo/state behavior.
- Next unlocked ticket: **none — T18 is the final scoped ticket**. Remaining
  human steps are the physical-device/screen-reader checks in
  `docs/launch-readiness.md`; do not mark all acceptance complete or claim a
  genuine-crowd launch from desktop emulation or synthetic fixtures.

## Standards

Independent fresh-context review found one minor test-clarity issue: the health
test grouped four independent readiness scenarios. Split into separately named
tests; all five health tests pass. Follow-up review, including the rapid-click
guard, calibrated CI timing probe and screenshot masks: **0 residual violations
or actionable smells**.

## Spec

Independent fresh-context review: **0 actionable implementation discrepancies**.
Follow-up review confirms the Pause guard preserves normal/keyboard activation,
the production smoke submits no real votes, and the measurements retain the
sub-60 throttled result honestly. Remaining physical-phone/screen-reader and
CI/deployment checks are tracked separately; human gates remain open and are
not claimed complete.

## User-authorized visual follow-up — 2026-10-31

The user explicitly requested a full professional redesign using the awwwards
skill and krillion.io for style inspiration. This follow-up preserves the T01–T18
ticket structure and completed dependencies. It does not authorize a real-data
release. Original orbital artwork, typography, mode navigation, responsive game
controls, result hierarchy, preference controls, privacy/recovery pages and
metadata were refreshed. No scoring, persistence, backend or poll eligibility
rules changed. See `DESIGN.md` and `docs/evidence/redesign/QA.md` for the brief,
independent review, test results and retained desktop/mobile evidence.
