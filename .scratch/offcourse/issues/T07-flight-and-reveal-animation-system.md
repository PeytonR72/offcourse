# T07: Flight and reveal animation system

Status: ready-for-agent
Blocked by: T06
Execution: Authorized by the user's "/implement ticket 7, auto accept seams and tests" instruction on 2026-10-29. T06 complete.
Completion: Complete.

## What to build

Implement anticipation/ignition/flight/approach/landing or drift-out for exact/near/fail; skip/reduced-motion fallbacks.

## Tests and acceptance

- [x] state transitions and events across 3 outcomes, skip leaves stable final state, reduced-motion path works. Manual motion QA/video.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Used the implement, tdd, codebase-design and code-review skills, plus the React
  quality checklist. User pre-approved seams/tests: pure flight controller;
  authoritative round-to-scene adapter/shared frame sampler; DOM and desktop/mobile
  browser interactions. Kept T08–T12 work outside this ticket.
- One elapsed-time controller advances existing immutable domain events in order:
  anticipation, ignition at 130ms, flight at 330ms, approach at 1000ms, reveal at
  1200ms and settlement at 1800ms. Actual distribution/accuracy stays hidden until
  reveal. Exact celebrates with a landing hop/ring; inclusive 10-point near hits
  wobble into landing; misses tumble and drift out. Presentation never judges a
  score. Shared trajectory/frame geometry drives both Pixi and SVG.
- Skip unlocks after reveal and resolves to the same stable result; reduced motion
  bypasses flight to a static result, including preference changes during flight.
  Catch-up after browser suspension dispatches ordered events and credits once.
  Input is locked in flight, result receives keyboard focus, and canceled frames
  cannot advance a continued round. Renderer lifecycle and GPU fallback remain intact.
- Red: first flight-controller test failed because the module was absent; outcome
  tests then failed because skip/reduced motion left the round unresolved. Scene
  tests failed before the frame sampler existed. DOM flight test failed because
  actual results appeared immediately; reduced-motion test lacked a settled frame.
  Each slice passed after its implementation. Review refactor extracted the common
  curve-position helper to preserve continuity at reveal.
- Validation: npm test (95 tests in 9 files), targeted flight/scene/UI suites,
  npm run typecheck, npm run lint, npm run format:check, npm run build, and
  npm run test:e2e (20 tests across desktop/mobile) passed. Production / prerenders.
  Existing canvas screenshot baselines still pass without changes.
- Manual visual QA: reviewed desktop 1440x900 and mobile 393x851 screenshots plus
  sampled frames from real-time recordings of exact/10-point/11-point flights.
  Captured all three outcomes without skipping; no browser errors. Adjusted miss
  drift upward after QA showed it crossing the scene caption. Retained six result
  screenshots and desktop-motion.webm/mobile-motion.webm in docs/evidence/t07/.
  These are Chromium device emulations; no real-phone FPS claim is made.
- Independent fresh-context precommit review against baseline
  52fcccb81bf92a58aa75bdbc13a533eaafc6b437 using the staged diff: Standards had
  zero documented violations and one low-priority duplicate-geometry smell, fixed
  and confirmed by re-review; zero outstanding findings. Spec: zero code findings.
  Pending manual evidence from that review was subsequently completed above.
- Implementation commit reference: :/^T07: add flight and reveal animation system$.
  Delivered on main under the workflow's automatic commit/push authorization.
- Next ticket: T08, Daily Expedition end-to-end. T09 and T10 are also unlocked.
  Stop after T07; later tickets still require explicit authorization.
