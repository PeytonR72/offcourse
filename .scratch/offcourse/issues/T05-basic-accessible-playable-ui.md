# T05: Basic accessible playable UI

Status: ready-for-agent
Blocked by: T02–T04
Execution: Authorized by the user's `implement ticket 5` command and subsequent
"It's done- go ahead now" instruction on 2026-10-29; T02–T04 complete.
Completion: Complete.

## What to build

One question card, YES/NO choice, 0–100 aim, lock, numeric reveal and continue; mobile and desktop with DOM controls. Minimal visuals only.

## Tests and acceptance

- [x] Playwright journey and keyboard flow; slider correct on both platforms; cannot lock twice; result is hidden before lock.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Added a minimal DOM practice question card using the existing validated demo
  selector and authoritative run transitions. Native YES/NO radio controls,
  integer 0–100 range input, lock, numeric result, and continue work without a
  canvas. Choosing NO never reverses the YES prediction axis. Practice uses the
  continuing scoring rule; no ranked daily attempt or endless records are exposed.
- Lock advances synchronously through locked/flight/reveal/resolved for this
  numeric-only slice. Duplicate lock events are ignored after resolution; continue
  selects a fresh question and resets input. Exhaustion shows practice completion.
  Pixi rendering, animation, persistence, and full daily/endless modes remain in
  their assigned later tickets.
- Kept prominent Illustrative results and simulated-data disclosures. Controls
  have explicit labels, visible focus, 48px touch targets, a result status region,
  and focus transfer to result/new-question headings. Reviewed production
  screenshots at desktop 1440 x 900 and mobile 393 x 851: readable controls and
  numeric feedback, no horizontal overflow. Browser checks exercise keyboard
  navigation, Home/End/arrow aiming, touch/pointer aiming and rapid double lock.
- Confirmed seams: rendered UI through React Testing Library, and mobile/desktop
  browser journeys through Playwright. **Red:** UI test failed for the absent lock
  control; after input implementation passed, the reveal/continue test failed for
  the absent Round result. **Green:** each slice passed after implementation.
- Validation: `npm test -- src/app/page.test.tsx` (3 tests), `npm test` (80 tests
  across 6 files), `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm run build`, and `npm run test:e2e` (6 tests) all passed.
- Visual evidence retained in ignored `test-results/`: `home.png` for both
  home-page projects; `aim.png` in the pointer-aim projects; `result.png` in the
  keyboard-controls projects, each with desktop/mobile suffixes.
- User-confirmed review baseline: `b3f16eb0f1f666134f66d0d2fdc436a0cf0840f3`.
  Separate fresh-context reviewers inspected the staged diff before commit.
  Standards review found a second-round focus jump during answer selection; an
  extended keyboard test reproduced it on desktop and mobile. Restricted heading
  focus to new-question/result phases, rebuilt, and all 6 browser checks passed.
  Re-review: **Standards: 0 remaining findings. Spec: 0 findings.** Targeted UI,
  typecheck, lint, and formatting checks also passed after the fix.
- Implementation commit reference: `:/^T05: add accessible practice UI$` on `main`.
- Next unlocked ticket: T06 (Rocket rendering vertical slice). No later ticket
  is authorized by this command.
