# T08: Daily Expedition end-to-end

Status: ready-for-agent
Blocked by: T03–T07
Execution: Authorized by the user's `implement ticket 8` command and "Auto accept
seams and tests" instruction on 2026-10-29. T03–T07 complete.
Completion: Complete.

## What to build

Five-round game, progress, distance total, results summary, same seed for all users per day.

## Tests and acceptance

- [x] complete five rounds even after failures; same-day replay blocked locally; reset on UTC rollover; zero/maximum score boundaries.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Used implement, tdd, codebase-design, code-review, and the React quality
  checklist. User accepted the daily-session, persistence, DOM UI, and browser
  test seams automatically. Implemented only T08.
- Added `/daily`, linked from practice. The existing Daily Five selector pins
  five distinct questions by UTC date/catalog version. Daily progression uses
  the existing run transitions/scoring, permits every round after misses, stops
  at five, and displays round progress, cumulative distance, and a per-round
  completion summary. Known boundaries: five exact predictions earn 500 ly;
  five large misses still finish and earn 0 ly.
- Extracted the existing flight UI into a shared controlled RoundPlayer so daily
  uses the same anticipation/reveal/skip/reduced-motion path and Pixi/SVG fallback
  as practice. Existing keyboard, pointer, rapid-lock, renderer-reuse, and flight
  tests still pass. A visual review corrected the shared caption to Demo flight.
- Versioned dated browser records save the frozen manifest, predictions, and
  unlocked input. Locks save synchronously before playback; reload reconstructs
  scores through domain transitions and settles each saved lock once. Completed
  attempts reopen their summary with no replay. Stale-tab writes are rejected.
  Unavailable/corrupt storage stops daily safely with a practice recovery link.
  Clearing storage and cross-device limitations are disclosed; all percentages
  remain visibly simulated, with no public ranked score or real-data claim.
- UTC rollover unlocks a fresh attempt on an open page or reload, with focus/tab
  visibility catch-up and stale-date writes rejected. The next reset displays in
  the player's local time. Clock, catalog, and storage are injected into the
  repository for deterministic verification; no backend or live services added.
- Red: the first daily progression test failed because the daily module was
  absent; the persistence test failed before the repository existed; the daily
  DOM journey failed before the UI existed. Each slice passed after minimum
  implementation. Targeted UI tests also caught a missing question-set argument
  during the shared-player extraction; fixed before proceeding. Browser storage
  recovery first hit an ambiguous alert locator due to Next's route announcer;
  scoped that test to the main content and confirmed the recovery journey.
- Targeted checks passed repeatedly: `npm test -- src/domain/daily.test.ts`
  (9 tests), daily/practice RTL (6 tests), and `npm run typecheck`.
  Final full checks passed: `npm test` (105 tests across 11 files),
  `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm run build`, and `npm run test:e2e` (30 tests on desktop/mobile).
  After the caption correction, rebuilt, reran targeted RTL/typecheck, and all
  10 daily browser checks passed with refreshed screenshots. `/daily` prerenders.
- Reviewed desktop 1440x900 and mobile 393x851 Chromium screenshots: readable
  controls, summaries, disclosure, reset time, no horizontal overflow. Retained
  `docs/evidence/t08/desktop-aim.png`, `mobile-aim.png`,
  `desktop-summary-500.png`, and `mobile-summary-0.png`. Device emulation is not
  real-phone performance profiling; no FPS claim is made.
- Independent fresh-context precommit reviews compared the staged diff against
  baseline `b520b2bb463c76ef70876962640cb8477b8e1bc9`:
  **Standards: 0 findings. Spec: 0 findings.** Both reviewed the caption fix;
  pending build/evidence recapture subsequently completed successfully.
- Implementation commit reference: `:/^T08: implement Daily Expedition$` on main,
  delivered under the workflow's automatic commit/push authorization.
- Next ticket: T09, Endless Voyage end-to-end (already dependency-unlocked).
  T10 is also available. Stop after T08; later tickets need authorization.
