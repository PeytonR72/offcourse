# T10: Original rocket sprites and expression states

Status: ready-for-agent
Blocked by: T07
Execution: Authorized by the user's implement ticket 10 instruction, with seams and tests auto-accepted, on 2026-10-29. T07 complete.
Completion: Complete.

## What to build

Produce cohesive original rocket sprite sheet (idle, anticipation, happy, scared, tumble), thruster frames, design tokens.

## Tests and acceptance

- [x] asset loading/fallback, no missing frame keys, sprite readability at smallest portrait viewport. Manual frame-by-frame art review.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Applied implement and tdd at the auto-accepted presentation selection, image
  loading/fallback, and browser rendering seams. Scope is T10 only.
- Original integer-pixel artwork: five expressive rocket cells (idle,
  anticipation, happy, scared, tumble) and four thruster cells in a transparent
  320x80 atlas. Palette/scale tokens and frame registry are in rocket-art.ts;
  docs/rocket-art.md records authoring and regeneration. No external art or
  services. Pixi uses one nearest-filtered source and releases all frame textures.
- Both renderers share the same editable paths. Missing, corrupt, or mis-sized
  art recovers from embedded source; failed GPU/image initialization retains the
  inline SVG rocket and playable controls. Existing scene/flight state selects
  expressions and engine frames without another clock, scoring, or spoiler cues.
  Reduced motion retains static settlement. No T11/T12 features added.
- Red/green: expression test failed on absent module; recovery test failed on
  absent loader; thruster test failed on absent frame selection. Browser test
  failed on absent expression/art before integration. Each slice then passed.
- Targeted sprite tests and 18 targeted desktop/mobile browser checks passed.
  Full unit suite: npm test passed 118 tests in 14 files. npm run typecheck,
  npm run lint, npm run format:check, and npm run build passed. Final
  npm run test:e2e passed all 42 desktop/mobile checks, including Daily,
  Endless, keyboard flow, all outcomes, asset recovery, and GPU fallback.
- Manual frame-by-frame review: all five expressions plus four exhaust cells
  checked on enlarged contact sheet. Desktop (1440x900), mobile (393x851), and
  smallest portrait (320x740) captures reviewed. Silhouette >=30x20 CSS px at 320;
  cropped sprite snapshots verify matching loaded/embedded rendering. Retained
  15 screenshots under docs/evidence/t10/, including every expression and GPU
  fallback. Browser emulation only; no real-device performance claim.
- Independent fresh-context precommit code review used the staged diff against
  74bc897b2e61d64db9453ea3c339dd0da6cd3369. Standards: zero findings (no documented
  violations or material baseline smells). Spec: zero findings (no omissions,
  incorrect behavior, or scope creep). React checklist passed: shared derived
  presentation, no new effects/timers/state, and existing accessible figure.
- Implementation commit reference: :/^T10: add original rocket expression sprites$.
  Commit and push to main under the existing automatic delivery authorization.
- Next ticket: T11, Parallax universe and progression (T06/T09 complete).
  T12 remains blocked by T11. Stop after T10.
