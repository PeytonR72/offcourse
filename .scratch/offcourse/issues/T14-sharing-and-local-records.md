# T14: Sharing and local records

Status: ready-for-agent
Blocked by: T08, T09
Execution: Authorized by the user's `/implement ticket 14 auto approve seams tests`
command on 2026-10-30. T08 and T09 complete.
Completion: Complete.

## What to build

Shareable anonymous daily summary (distance and accuracy, with date), endless best streak, local preferences, replay affordances. Native share where available, copy fallback.

## Tests and acceptance

- [x] deterministic share text, no personal data, localStorage unavailable fallback, records persist, correct comparison across attempts.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Used implement and TDD at automatically approved summary, repository, DOM,
  browser-sharing and browser-storage seams. Applied the React quality checklist.
- Daily completion now displays date, distance and prediction accuracy (100 minus
  mean absolute percentage-point error), with native sharing, explicit copy, and
  selectable text for clipboard denial. Cancellation does not copy; repeated
  clicks cannot open concurrent shares. Shared text contains no question prompts,
  personal answers, installation IDs or URL parameters; demo disclosure travels
  with the summary. Same-day reload restores the identical summary, never replay.
- Added summary links to Endless/practice and a Daily link after Endless ends.
  Existing independent best streak/distance and restart persistence are reused.
  Preference tests now cover sound, haptics and reduced motion together.
- Added a browser storage adapter that retains accessed records in session memory
  after denied access, read/write failure or quota exhaustion. Both modes remain
  playable with a session-only notice. Invalid records still fail safely without
  being overwritten; existing stale-tab and once-only scoring guards are retained.
- Red: missing summary module, missing share UI, missing storage adapter, absent
  daily share affordances, and blocked-storage UI journeys failed before their
  corresponding implementation. Incremental green checks passed. A cancellation
  test caught DOMException not always inheriting Error; fixed by checking its name.
- Precommit review baseline: `78f816e47df9cd7b68c984ed0e91613bd8e87b00`.
- A final navigation regression failed when session-only progress was scoped to
  each route. Added a root-layout storage provider, resolved only in client
  effects, so drafts and records survive switching modes until reload/close.
  Both Daily and Endless browser journeys now leave through practice and return
  with the same 73% NO draft before locking.
- Final checks passed: `npm test` (137 tests across 19 files),
  `npm run typecheck`, `npm run lint`, `npm run format:check`, and
  `npm run build`. All three game routes still prerender.
- `npm run test:e2e` passed 74 checks with 6 intentional skips (the existing
  duplicated device-matrix contexts and desktop touch-only case). After the
  provider fix/rebuild, reran all affected Daily, Endless, sharing/storage and
  experience checks: 34 passed on desktop/mobile Chromium. Initial targeted
  browser checks exposed an old blocked-storage expectation; updated recovery
  tests to use corrupt records and kept separate blocked-storage play coverage.
- Reviewed desktop 1440x900 and mobile 393x851 summaries and session notices:
  readable text, visible disclosure, full-size share/copy/replay controls and no
  horizontal overflow. Retained four PNGs in `docs/evidence/t14/`:
  `desktop-summary.png`, `mobile-summary.png`, `desktop-session.png`, and
  `mobile-session.png`. These are browser emulations, not physical-phone or
  native OS share-sheet validation; browser share/clipboard adapters are stubbed
  to verify payloads without sending a real share.
- Independent fresh-context code reviews against the baseline above:
  **Standards: 0 findings. Spec: 0 findings.** Both follow-up reviews also returned
  zero findings after the root storage provider and navigation regression.
- Implementation commit reference: `:/^T14: add sharing and local records$`.
  Commit and push to main under existing automatic delivery authorization.
- Next unlocked ticket: T15, real poll ingestion and eligibility pipeline. Stop
  after T14; T15 needs separate implementation authorization.
