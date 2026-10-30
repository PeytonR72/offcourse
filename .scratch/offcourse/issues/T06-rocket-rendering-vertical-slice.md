# T06: Rocket rendering vertical slice

Status: ready-for-agent
Blocked by: T05
Execution: Authorized by the user's "Implement ticket 6, approve seams and tests automatically" instruction on 2026-10-29, with explicit /implement skill invocation. T05 complete.
Completion: Complete.

## What to build

Add Pixi scene with rocket, one destination, starfield, deterministic trajectory line; scene responds to state; SSR-safe mount/unmount.

## Tests and acceptance

- [x] render lifecycle, state event adapter, no double renderer, basic screenshot test; app still playable if canvas fails.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Used Matt Pocock's implement, tdd, codebase-design, and code-review skills.
  Approved seams: pure round-to-scene adapter; renderer lifecycle at the GPU
  interface; browser journeys and screenshot comparisons on desktop/mobile.
- PixiJS 8 scene has an original small pixel rocket, fixed starfield, one
  destination and deterministic YES prediction path. A revealed target adds a
  teal actual path. The existing domain state remains the only scoring authority.
  No timeline or T07 animation system was added.
- Pixi is dynamically imported from a client effect. Server output includes an
  SVG view; failed initialization or lost WebGL context removes the canvas and
  leaves all DOM play controls available. Initialization completion after disposal
  destroys the stale renderer, Strict Mode replay cancels discarded allocation,
  and ordinary state changes keep one canvas. Resources and resize observation
  are released on unmount. Rendering is on demand, DPR capped at 2, own sprite
  texture uses nearest filtering, and star count is fixed at 64.
- Red: adapter and lifecycle suites failed before their modules existed; the
  browser scene test failed because rocket-world was absent. Green: implementation
  passed those tests. Extended lifecycle tests cover delayed initialization,
  Strict Mode replay, rejected initialization, and context loss.
- Browser verification caught a rapid Lock click landing on Continue after the
  result layout appeared. Continue now ignores the second click of a multi-click.
  Updated coordinate-based pointer tests to scroll controls into view before
  clicking. Both mobile and desktop rapid-lock journeys now pass.
- Validation: npm test (86 tests in 8 files), targeted UI tests (3), npm run
  typecheck, npm run lint, npm run format:check, npm run build and npm run
  test:e2e (10 tests) passed. Build prerenders / successfully. Canvas screenshot
  comparisons pass using committed desktop/mobile baselines without text;
  1% pixel tolerance accommodates GPU rasterization differences.
- Reviewed screenshots at 1440x900 desktop and 393x851 mobile emulation. Retained
  docs/evidence/t06/desktop-aim.png, mobile-reveal.png, and mobile-fallback.png.
  Full-page journey images remain in ignored test-results. Real-phone performance
  profiling is deferred to its assigned later tickets; no FPS claim is made.
- Review baseline: 8687ce1d55948e21c92a232a04c34a4b69a0e2d3. Two independent
  fresh-context reviews inspected the staged diff before commit. Standards:
  zero hard violations, one nonblocking low-priority geometry duplication note
  between Pixi and the static SVG view. Spec: zero findings. The small duplicated
  presentation coordinates are retained for this slice; both views are verified.
- Implementation commit reference: :/^T06: add rocket rendering vertical slice$.
  Delivered on main under the workflow's automatic commit/push authorization.
- Next unlocked ticket: T07, Flight and reveal animation system. Stop after T06.
