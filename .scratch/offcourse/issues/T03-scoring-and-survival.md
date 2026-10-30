# T03: Scoring and survival

Status: ready-for-agent
Blocked by: T02
Execution: Authorized by the user's `implement ticket 3` command on 2026-10-29;
T02 complete. User confirmed scoring/run test seams and review baseline `3ce375e`.
Completion: Complete.

## What to build

Implement exact inclusive ±10 survival, distance formula, cumulative total, daily continuation and endless fatal miss.

## Tests and acceptance

- [x] 0, 1, 9, 10, 11, 20, 100 error; daily doesn’t end on miss; endless does; no negative distance.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Added pure `scoreRound(mode, guessPercentage, actualPercentage)` with absolute
  percentage-point error, inclusive ±10 survival, nonnegative integer distance,
  and zero distance for an endless fatal miss. Fractional crowd results retain
  their precision for survival; only distance rounds.
- Reveal attaches a frozen score to the pinned result. Resolution adds it once
  to `totalDistance`; an endless miss sets `status` to `lost` and blocks further
  events. Daily misses continue. Session completion, scheduling, streak/records,
  storage, and UI remain in their assigned later tickets.
- Confirmed test seams: pure scoring and `createRun`/`transitionRun`, plus existing
  mobile/desktop browser smoke checks. **Red:** the scoring stub failed the exact
  prediction case; subsequent boundary tests caught incorrect survival at 11/20/100,
  negative distance, incorrect endless miss credit, and missing fractional-distance
  rounding. Invalid percentages failed before guards were added. Run tests failed
  before cumulative distance and endless termination existed. Each implementation
  slice passed its targeted tests before proceeding.
- Review baseline: `3ce375e8ebc967155993ffe75685bef694fcb189`.
- Targeted verification passed repeatedly: `npm test -- src/domain/scoring.test.ts`
  (26 tests), `npm test -- src/domain/run.test.ts` (20 tests), and
  `npm run typecheck`.
- Final verification: `npm test` passed all 57 tests across four files;
  `npm run typecheck`, `npm run lint`, `npm run format:check`, and
  `npm run build` passed. `npm run test:e2e` passed both production smoke tests
  (desktop 1440 x 900 and mobile 393 x 851). This ticket has no visual changes.
- Separate fresh-context reviewers inspected the staged diff before commit:
  **Standards: 0 findings** (pure rules, immutable snapshots, centralized scoring,
  scope and validation follow repository standards); **Spec: 0 findings** (all T03
  requirements implemented without later-ticket work).
- Implementation commit reference: `:/^T03: implement scoring and survival$` on
  `main` (the commit containing this ticket and validation evidence).
- Next available ticket: T04 (Question seed and deterministic scheduling), whose
  dependency T02 is complete. T05 still needs T04. No further ticket is authorized.
