# T02: Domain types and rules

Status: ready-for-agent
Blocked by: T01
Execution: Authorized by the user's `implement ticket 2` command on 2026-10-29; T01 complete.
Completion: Complete.

## What to build

Create pure question/distribution/run types and explicit idle/answering/aiming/locked/flight/reveal/resolved states; invariant validation.

## Tests and acceptance

- [x] invalid transitions rejected; range 0–100; immutable lock; no duplicate scoring.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Added pure readonly Question, Distribution, Run, LockedAnswer, and ResolvedRound
  types in `src/domain/`. Content validation checks text, enums, percentage bounds,
  sample sizes, frozen timestamps, and positive snapshot versions. Crowd values
  may be fractional; guesses must be integer percentages from 0 to 100.
- `createRun` and `transitionRun` implement idle -> answering -> aiming -> locked
  -> flight -> reveal -> resolved. Personal YES/NO choice never reverses the YES
  prediction axis. Input may change only before lock; lock and reveal snapshots
  are copied and frozen. Reveal must match the pinned question/distribution/version.
- Resolution appends one immutable result; repeated resolution and reused round
  IDs throw. Scoring formulas, mode termination, question scheduling, persistence,
  and publication eligibility remain in their designated later tickets.
- TDD seam: exported content validators and pure run transitions, matching the
  authorized acceptance criteria. **Red:** content validation tests produced six
  assertion failures before validation existed; lock boundary tests failed before
  lock handling; lifecycle and mismatched-reveal tests failed before those rules.
  **Green:** targeted suites passed after each corresponding implementation.
- `npm test -- src/domain/content.test.ts` passed (10 tests).
  `npm test -- src/domain/run.test.ts` passed (14 tests).
  `npm run typecheck` passed repeatedly during implementation.
- Final verification: `npm test` passed all 25 tests across three files;
  `npm run lint`, `npm run format:check`, `npm run typecheck`, and
  `npm run build` passed. `npm run test:e2e` passed both production smoke tests
  (desktop 1440 x 900; mobile 393 x 851). No visual change was introduced.
- Review baseline: `79961ec67b98f0c8c12872d8a7e6a44a399a9552`.
  Separate fresh-context standards and spec reviewers inspected the staged diff
  before commit: **Standards: 0 findings. Spec: 0 findings.**
- Implementation commit reference: `:/^T02: define immutable domain rules$` on
  `main` (the commit containing this ticket and validation evidence).
- Next unlocked tickets: T03 (Scoring and survival) and T04 (Question seed and
  deterministic scheduling). Neither is authorized by the T02 command.
