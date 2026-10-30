# T12: Cozy motion polish + audio/haptics

Status: ready-for-agent
Blocked by: T07, T10, T11
Execution: Authorized by the user's implement ticket 12 instruction, with seams and tests auto-approved, on 2026-10-30. T07, T10, and T11 complete.
Completion: Complete.

## What to build

Springy card transitions, micro-bob, expressive squash, engine flicker, subtle particles, original sound toggle, optional haptics only where supported and user-triggered.

## Tests and acceptance

- [x] mute persists, reduced-motion honored, no forced autoplay, transition durations do not delay state/score, mobile interactions responsive.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Applied implement, TDD, two-axis code review, and the React quality checklist.
  Auto-approved seams: player controls/preferences, browser audio/haptic APIs,
  shared motion sampling, and mobile/desktop gameplay. Scope is T12 only.
- Motion for React adds short spring card responses without gating input, domain
  events, or score credit. Shared frame sampling adds a 3px idle bob/breath,
  ignition stretch, landing squash, engine flicker, and seven bounded exhaust
  sparks to both Pixi and SVG. Idle samples update refs at at most 30Hz, skip
  hidden-tab painting, and cancel on flight/unmount/reduced motion. Flight still
  uses the existing authoritative elapsed-time controller and scoring rules.
- Accessible 44px preference buttons persist sound, optional haptics, and manual
  reduced motion in versioned browser storage with an in-memory fallback. Device
  reduced motion takes precedence and changes live. Sound/haptics default off;
  haptics appear only when the API exists and use a short user-triggered launch
  pulse, suppressed under reduced motion. No haptic effect/timer callbacks.
- Original low-volume sine cues synthesize a rising launch, soft landing tones,
  and a descending miss. AudioContext is created/resumed only from an opted-in
  Lock interaction. Mute, hidden tabs, and abandoned-player cleanup silence and
  disarm cues; normal reloads and restored routes never authorize playback.
  Missing/blocked APIs and storage leave practice playable.
- Red/green evidence: preference import initially failed; browser sound test
  expected a note but received none; bob test found an unchanged y coordinate;
  spark test found no particles. Each slice passed after implementation. Review
  found retained-provider navigation could play a restored Daily cue using an
  abandoned practice flight's authorization; regression failed with three notes
  instead of two, then passed after stable unmount cancellation was added.
- Screenshot comparisons now enable reduced motion while comparing stationary
  art, with separate tests for idle polish. Existing baselines are unchanged.
  Keyboard coverage now traverses the new preference group before gameplay.
  Precommit caught a summary-focus race: finding the heading could finish before
  React's passive focus effect. Daily/Endless tests now await the focus condition
  itself, retaining the same accessibility requirement without a fixed delay.
- Manual visual QA: reviewed 1440x900 desktop and 393x851 mobile full-page views,
  all three flight outcomes, reduced motion, and twelve sampled video frames per
  viewport. No control/content occlusion or horizontal overflow; preference
  targets measured 44px tall. Retained 16 screenshots, two motion contact sheets,
  two real-time videos, QA JSON, and an actual synthesized-cue recording under
  docs/evidence/t12/. Recorded audio peak 0.04544 (no clipping). Chromium viewport
  emulation only; no real-phone performance or physical haptic claim.
- Independent fresh-context precommit reviews against
  585d61826d91282b218611fea58fba36f4d0e7a8: Standards found one optional duplicated
  outcome-classification smell, fixed by using the existing scene adapter. Spec
  found the abandoned-flight cue issue above. Both re-reviews report zero
  outstanding findings. React checklist passed: cleanup, stable callbacks,
  optional browser boundaries, no per-frame React state, and no scoring changes.
- Final validation: `npm test` passed all 124 tests in 16 files. Targeted
  flight/sprite/UI suites and 18 targeted browser checks passed. `npm run lint`,
  `npm run typecheck`, `npm run format:check`, and `npm run build` passed. Final
  `npm run test:e2e` passed all 56 desktop/mobile checks, covering both modes,
  feedback consent/restoration/navigation, keyboard, art recovery, GPU fallback,
  exact/near/miss outcomes, and reduced motion. All routes still prerender.
- Existing 4x CPU-throttled performance smoke passed unchanged budgets (median
  <50ms, p95 <100ms). Both viewports measured 16.7ms median and 33.4ms p95 frame
  gaps; raw measurements retained beside the visual evidence. This is a short
  emulated smoke check, not a sustained real-phone 60fps claim.
- Implementation commit reference: `:/^T12: add cozy motion and opt-in flight feedback$`.
  Commit and push to main under the existing automatic delivery authorization.
- Next unlocked ticket: T13, Mobile and desktop UX pass (T08/T09/T12 complete).
  Stop after T12; later tickets require separate authorization.
