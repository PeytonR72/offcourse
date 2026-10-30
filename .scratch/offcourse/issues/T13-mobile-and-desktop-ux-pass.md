# T13: Mobile and desktop UX pass

Status: ready-for-agent
Blocked by: T08, T09, T12
Execution: Authorized by the user's `/implement ticket 13 auto approve seams test`
instruction on 2026-10-30. T08, T09, and T12 complete.
Completion: Complete.

## What to build

Touch drag target, desktop keyboard, portrait/landscape layouts, safe areas, pause and resume, loading/error/reduced-motion.

## Tests and acceptance

- [x] Playwright device matrix (e.g. narrow 360px, iPhone viewport, 768px, desktop 1440px); no overflow/tiny text, touch target sizes, focus order, reload resilience.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Applied implement, TDD, two-axis code review, and the React quality checklist.
  The user auto-approved player controls/pause and browser behavior test seams.
  Scope is T13 only; scoring, frozen distributions, and repositories are unchanged.
- Shared RoundPlayer adds Pause/Resume before and after lock. Pause holds domain
  state and elapsed flight time, removes active answer/lock controls, cancels
  the flight frame loop, stops idle updates, and silences/disarms audio feedback.
  Hidden tabs pause automatically and require explicit Resume. Focus moves to
  Resume, then back to the question/locked heading. Saved Daily/Endless drafts
  and once-only locked recovery continue through the existing repositories;
  practice remains temporary. Pausing adds no scoring state or alternate timer.
- Enlarged the prediction thumb to 32px inside its 48px input, retained native
  integer range/keyboard behavior and vertical scrolling, and added keyboard
  guidance. Buttons/answer labels measure at least 44px. Storage recovery now
  offers a full-size practice link. Safe-area viewport coverage and body padding
  protect notched screens; short landscape views use centered uniform scaling
  matching SVG, keeping planets and sprites proportional.
- Red: the new RTL pause test failed because Pause did not exist. The browser
  recovery-target test failed with a 17px link. The device matrix also found
  Pixi's 1px offscreen mobile accessibility activation button; hidden that unused
  hook and disabled its Tab activation because the world has a DOM text
  alternative and all gameplay controls are native DOM. Each slice passed after
  its implementation. Native touch dragging changes aim without scrolling and
  the saved prediction survives reload.
- Full-browser visual checking found two follow-ups: a short landscape viewport
  stretched Pixi content, corrected with uniform contain scaling; reduced motion
  could leave a stale directly-mutated SVG idle pose, which shifted screenshot
  clipping. A new browser regression demonstrated the stale pose before its fix
  and passes after explicit static-pose restoration. Reviewed and refreshed the
  desktop idle-art baseline for corrected alignment, retaining its 1% tolerance;
  added a landscape-world visual baseline to prevent stretched-art regression.
  The pointer test now starts at zero and clicks the midpoint for 50%, avoiding
  assumptions about the old thumb width while still testing real pointer input.
- Independent fresh-context reviews compare against pre-ticket baseline
  `aa1b8eaf1e886fb136e78915ebd62d3ca888b8ab`: **Standards: 0 findings;
  Spec: 0 findings**, including follow-up review of both visual corrections.
  React checklist: effect cleanup, focus management, transient elapsed ref,
  no per-frame idle React state, optional browser boundaries, and one scoring
  authority retained.
- Manual visual QA reviewed aiming, pause, and results across narrow 360×740,
  iPhone-sized 393×852, 768×1024 tablet, 1440×900 desktop, and 844×390 landscape.
  Readable wrapping, visible simulated-data disclosures, no horizontal overflow,
  and no world/control occlusion. Retained 35 screenshots and five JSON target
  measurement reports in `docs/evidence/t13/`. All measured controls/answer-label
  targets are at least 44px in both dimensions; the range is 48px tall. Physical
  notches and Safari are not emulated by Chromium; real-device launch profiling
  remains T18. No physical-phone performance claim is made.
- Final validation passed: `npm test` (125 tests across 17 files),
  `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`,
  and `npm run test:e2e` (70 passing browser checks). Six intentional skips
  avoid duplicating the five self-contained matrix contexts under the mobile
  project and running the touch-only drag case under desktop. Existing daily,
  endless, keyboard, GPU/art fallback, audio consent, all outcome, and reduced
  motion journeys pass. All app routes still prerender. Existing CPU-throttled
  performance smoke passes its unchanged budgets on both projects.
- Implementation commit reference: `:/^T13: improve mobile and desktop UX$`.
  Commit and push to main under the existing automatic delivery authorization.
- Next ticket: T14, Sharing and local records (dependency-unlocked). Stop after
  T13; later tickets require separate authorization.
