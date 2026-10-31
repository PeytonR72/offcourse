# T18: Production QA, privacy, and launch

Status: ready-for-agent
Blocked by: T10–T17
Execution: Authorized by `/implement ticket 18 auto accept tests seams` on
2026-10-30. T10–T17 complete. Seams and tests automatically approved.
Completion: In progress. Physical-phone profiling and screen-reader QA remain
human release gates; the deployed game must remain demo-only.

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
- Format, lint, typecheck and production build pass. Full Vitest rerun passed
  182 tests before splitting three independent health scenarios; the five
  resulting health tests passed. Final precommit full results will be appended.
  An earlier daily test timeout under competing browser/build load passed both
  targeted and full sequential reruns, with no unrelated gameplay change.
- Performance report and four manually reviewed desktop/mobile screenshots:
  `docs/evidence/t18/`. Final measured desktop rAF cadence **60.0 FPS**; 4× CPU
  mobile emulation **43.8–46.5 FPS**, p95 **33.4 ms**. No phone or GPU-presentation
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
- Commit/push, new deployment, CI and production smoke evidence are pending.

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
final CI/deployment gates are reported as pending, not claimed complete.
