# T04: Question seed and deterministic scheduling

Status: ready-for-agent
Blocked by: T02
Execution: Authorized by the user's `implement ticket 4` command on 2026-10-29;
T02 complete. User confirmed catalog/selection test seams and baseline `e36d660`.
Completion: Complete.

## What to build

40+ editorially reviewed original sample questions with versioned simulated distribution and correct labeling; deterministic Daily Five by UTC day; no repeat within endless run.

## Tests and acceptance

- [x] deterministic for same date/version; different date may vary; duplicates excluded; pool exhaustion explicit; excludes invalid data.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Added 40 original prompts across eight categories in `src/data/demo-questions.ts`.
  Catalog and distributions are versioned and frozen. All results are simulated,
  labeled **Illustrative results**, attributed as authored demo examples, have
  sample size zero, and remain ineligible for real scored content. The agent
  editorial pass and content/versioning rules are recorded in `docs/demo-content.md`.
- Pure `selectDailyDemo(catalog, at)` pins exactly five distinct snapshots to the
  UTC date/catalog version independent of input order, timezone, and ambient
  randomness. Insufficient valid content returns explicit unavailability with
  no partial daily. Invalid, unpublished, non-demo, mismatched, and ambiguous
  duplicate identities are excluded.
- Pure `selectEndlessDemo(catalog, seenQuestionIds, random)` excludes issued IDs,
  validates injected random draws, and explicitly returns `pool_exhausted`.
  Selected content is copied and frozen against later caller mutation. Run/UI,
  persistence, live data, and server manifest integration remain in later tickets.
- Confirmed seams: exported seed catalog and pure daily/endless selectors.
  **Red:** the empty seed failed the minimum-40 assertion; selection stub failed
  Daily Five; a fixed order failed UTC/version variation; invalid and repeated
  identities failed exclusion tests; the endless stub exhausted too early;
  invalid random draws and catalog versions failed rejection checks; caller edits
  changed issued targets before snapshot protection. **Green:** targeted tests
  passed after their corresponding minimal implementation slices.
- Targeted verification passed repeatedly: `npm test -- src/data/demo-questions.test.ts`
  and `npm test -- src/domain/questions.test.ts` (21 tests combined), plus
  `npm run typecheck`. Integration coverage traverses all 40 seeded questions
  once and confirms stable same-day selection and explicit pool completion.
- Final verification: `npm test` passed all 78 tests across six files;
  `npm run typecheck`, `npm run lint`, `npm run format:check`, and
  `npm run build` passed. `npm run test:e2e` passed both production smoke tests
  (desktop 1440 x 900 and mobile 393 x 851), retaining screenshots in the ignored
  `test-results/` directory. This ticket introduces no visual changes.
- Review baseline: `e36d6607354b80f64b0771561876366ca67e0cb1`. Separate fresh-context
  standards and spec reviewers inspected the staged T04 diff before commit:
  **Standards: 0 findings. Spec: 0 findings.** The concurrent authorized Vercel
  phone-testing commit `f416689` was preserved and excluded from T04 review scope.
- Implementation commit reference: `:/^T04: seed demo questions and deterministic schedules$`
  on `main` (the commit containing this ticket and evidence).
- Next unlocked ticket: T05 (Basic accessible playable UI); T02–T04 are complete.
  No further ticket is authorized by the T04 command.
