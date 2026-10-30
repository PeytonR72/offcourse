# T11: Parallax universe and progression

Status: ready-for-agent
Blocked by: T06, T09
Execution: Authorized by the user's implement ticket 11 instruction, with seams and tests auto-accepted, on 2026-10-29. T06 and T09 complete.
Completion: Complete.

## What to build

Layered backgrounds, planet variety, drifting debris, regions at streak milestones.

## Tests and acceptance

- [x] seeded layouts reproducible, no content occlusion, no progression rule impact, performance smoke on mobile.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Applied implement, TDD, and independent code-review skills, plus the React
  quality checklist. Approved seams: pure seeded scenery/progression, the
  presentation adapter, and desktop/mobile browser journeys. Scope is T11 only.
- Added deterministic question-seeded layouts: two star depths, a distant haze,
  ringed/cratered/striped planets, and foreground debris. Flight-driven parallax
  moves nearby debris faster than distant stars. Uses the existing authoritative
  flight clock; no idle ticker, scoring changes, extra state machine, or services.
  Pixi caches background geometry between layout changes. Counts remain bounded
  at 64 stars, three planets and eight debris pieces; existing DPR cap stays 2.
- Endless credited successes select Home orbit, Amber shoals (5), Tidal nebula
  (15), and Violet frontier (30). Daily/practice keep Home orbit. Question identity
  seeds decoration, so reloads reproduce it. Hidden distributions never select
  scenery. SVG fallback shares the same layout, palette and parallax mapping;
  reduced motion retains the existing static settlement behavior.
- Red/green: seeded-layout test failed before its module existed. Browser region
  accessibility check failed before the figure label included the region. Visual
  review then caught a lower planet touching the mobile caption; the regression
  test failed on overlapping bounds before moving decoration into a safe area.
  Tests now cover reproducibility, bounded decoration, exact milestone boundaries,
  all 40 unique destinations and unchanged 4000-ly scoring, hidden-target isolation,
  reload persistence, and caption clearance at desktop/mobile plus 320px width.
- Validation: targeted pure and browser suites passed; final `npm test` passed
  121 tests in 15 files. `npm run typecheck`, `npm run lint`,
  `npm run format:check`, `npm run build`, and final `npm run test:e2e`
  passed (44 desktop/mobile Chromium checks). All three game routes prerender.
  Existing keyboard, daily, outcome/skip/reduced-motion, art and GPU-fallback
  checks pass. Updated the two scene screenshot baselines for the new universe.
- An initial simultaneous full-unit/eight-browser run saturated the host: one
  DOM test timed out and mobile p95 reached the strict 100-ms limit. Kept the
  performance budget, capped Playwright at two workers, and ran suites separately;
  both full suites passed. CPU smoke uses 4x throttling, median <50ms and p95
  <100ms budgets. Final desktop/mobile median gaps were 16.7ms and p95 33.4ms
  over 108/106 sampled frames. Raw JSON retained under docs/evidence/t11/.
  Browser viewport/CPU emulation only; no real-phone or sustained-60fps claim.
- Reviewed all four region screenshots on 1440x900 desktop and 393x851 mobile,
  plus full-page result views. Rocket, trajectory, captions, questions and controls
  remain readable, without horizontal overflow. Ten PNGs retained in
  docs/evidence/t11/; narrower 320x740 caption clearance is browser-asserted.
- Independent fresh-context reviews against pre-ticket baseline
  ca47f12ce448097a9daed1dc90905e41b83ae8f5: Standards had no findings. Spec
  identified the caption overlap; after correction, Spec had no unresolved findings.
  Follow-up Standards review also cleared the layout/test-concurrency changes.
- Implementation commit reference: `:/^T11: add parallax universe and streak regions$`.
  Commit and push to main under the existing automatic delivery authorization.
- Next unlocked ticket: T12, Cozy motion polish + audio/haptics (T07/T10/T11
  complete). Stop after T11; later tickets need separate authorization.
