# T09: Endless Voyage end-to-end

Status: ready-for-agent
Blocked by: T03–T07
Execution: Authorized by the user's `/implement ticket 9, auto approve tests and seams`
command on 2026-10-29. T03–T07 complete.
Completion: Complete.

## What to build

Unlimited consecutive eligible questions, lose on first >10 error, run results, restart, best streak and distance.

## Tests and acceptance

- [x] 10 survives, 11 ends, no advance after death, no repeats, restart resets current streak but preserves best, exhaustion state distinct from loss.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Used implement, TDD, codebase-design, code-review, and the React quality
  checklist. The user automatically approved session, repository, DOM UI, and
  browser test seams. Implemented only T09.
- Added `/endless`, linked below practice. The existing eligible demo selector
  pins a randomized, frozen question order using injected randomness. Every
  question can appear once per run, without an arbitrary round cap. The first
  error over 10 points ends the run and earns zero distance; exactly 10 survives.
  Reaching all 40 demo destinations completes the voyage explicitly. Missing
  the final question still counts as a loss.
- Shows current streak, distance, prominently styled best streak, and independent
  best distance. Both terminal outcomes show numeric last-round feedback and a
  restart action. Restart resets the current run while preserving browser bests.
  The existing shared RoundPlayer retains anticipation, reveal, skip, reduced
  motion, and Pixi/SVG fallback. No animation or scoring rules were duplicated.
- Versioned browser records pin questions, inputs, and records together. Reload
  reconstructs scores through validated domain transitions, credits saved locks
  once, restores drafts, and reopens lost/completed runs. Stale-tab writes are
  rejected. Unavailable or corrupt storage stops safely with a practice recovery
  link. Records remain browser-local; clearing-storage limits and simulated-data
  disclosures are visible. No live data, services, or public ranked scores added.
- Red: session test failed before `endless.ts` existed, repository test failed
  before persistence existed, and DOM journey failed before the UI existed.
  Each vertical slice passed after implementation. Added regression checks for
  reload idempotency/frozen targets, all 40 unique questions, empty/exhausted
  pools, stale tabs, invalid stored input, independent bests, and final-round loss.
- Initial full checks passed (113 Vitest tests and 38 desktop/mobile browser
  tests). Lint caught synchronous state initialization inside an effect; changed
  storage initialization to a cancellable microtask, then passed lint, typecheck,
  format, build, and all 8 Endless browser checks. Two additional domain cases
  bring the Vitest total to 115.
- Initial independent reviews against pre-ticket baseline
  `da15e1075fb0619dd38726c80cd0fbf409b09b5b`: Spec had no findings; Standards
  had no documented violations and two nonblocking duplication judgments.
  Refactored shared run input serialization/replay into `run-record.ts` and
  shared storage recovery markup into `ProgressNotice`, used by both modes.
  Targeted daily/endless domain and DOM checks passed (20 tests) after extraction.
- Reviewed desktop 1440x900 and mobile 393x851 screenshots for aim, loss, and
  pool completion: readable controls/results, prominent best streak, visible
  disclosure, no horizontal overflow. Retained six PNGs in `docs/evidence/t09/`.
  This is browser device emulation, not real-phone FPS profiling.
- Final checks passed after refactoring: `npm test` (115 tests across 13 files),
  `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`,
  and `npm run test:e2e` (38 tests across desktop/mobile Chromium). Both routes
  prerender; daily reload/rollover/replay checks also passed after extraction.
  Independent follow-up reviews: **Standards: 0 findings. Spec: 0 findings.**
  Both original duplication judgments were resolved; no daily regression found.
- Implementation commit reference: `:/^T09: implement Endless Voyage$` on main,
  delivered under the workflow's automatic commit/push authorization.
- Next ticket: T10, original rocket sprites and expression states. T11 and T14
  also become dependency-unlocked after T09. Stop after T09; later tickets need
  separate authorization.
