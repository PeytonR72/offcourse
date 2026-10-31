# T17: Publishable daily & endless content strategy

Status: ready-for-agent
Blocked by: T15–T16
Execution: Authorized by the user's `/implement ticket 17 auto accept tests seams`
command on 2026-10-30. T15–T16 complete. Test seams and tests automatically approved.
Completion: Complete.

## What to build

Editorial schedule for daily + sufficiently large endless pool; question retirement/quality metrics, no recent repeats, exhaustion logic; transition from prototype simulated to actual qualified scoring only when coverage is sufficient.

## Tests and acceptance

- [x] 7 days of manifests stable; no duplicate round in run; insufficient sample blocked; date rollover time zones; real-data badging accurate.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Scope limited to T17. Fixed review baseline:
  `9f1e31d0d968842db3fe2cd6779e24d0009e8fea`.
- Used implement, TDD, codebase-design, code-review, and React review guidance.
  Accepted seams: trusted editorial repository/publication, server play selection
  and coverage, source labels/availability at the browser interface.
- Demonstrated red/green slices: missing week interface; missing coverage and
  retirement controls; undersized catalog incorrectly opening scored play;
  recent questions reappearing in fresh endless runs; absent source badges and
  content guidance. Follow-up regressions failed across Los Angeles DST before
  switching to 168 elapsed hours, and failed source-aware slider labels before
  replacing “players” with “poll respondents” for qualified polls.
- Migration `003-content.sql` adds atomic seven-day publication, seven-date daily
  repeat protection across snapshot versions and neighboring dates, retirement
  metadata, eligible snapshot selection, and persistent lock timestamps. New
  scored daily/endless runs require seven ready Daily Five manifests and at least
  100 distinct qualified questions. Legacy recent-repeat calendars fail coverage.
  Historical manifests and results remain immutable; old locks conservatively
  enter the cooldown at migration time.
- Fresh endless runs exclude this installation's questions locked in either mode
  during the previous 168 hours. One latest eligible version per question is
  pinned for the run, with no duplicate rounds. An all-recent pool explicitly
  exhausts without a loss or score. Issued runs keep their targets and can resume
  through retirement, coverage shortage, and UTC rollover. No real/simulated
  fallback is introduced.
- Trusted CLI adds `publish-week`, `coverage`, `quality`, and `retire`. Quality
  reports latest sample size, official attempt count, mean error, miss percentage,
  and editorial/retirement state. The editorial cadence, initial pool rationale,
  quality review, immutable-calendar limitations, repeat policy, role grants, and
  release gate are documented in `docs/content-strategy.md`.
- Qualified play displays source-specific Offcourse/licensed poll badges and
  respondent wording, with sample/attribution only after earned reveal. Content
  shortages and exhausted recent pools have explicit availability guidance.
  Demo pages remain illustrative; no live sourcing, live collection, hosted
  migration, paid service, production configuration, or public release is enabled.
- Final checks passed: `npm test` (**178 tests / 24 files**), `npm run lint`,
  `npm run typecheck`, `npm run format:check`, `npm run build`, and `npm run polls`
  CLI startup/help without credentials. An initial full-suite run during parallel
  build load hit a pre-existing focus-test timeout; its targeted rerun and full
  sequential reruns passed. No unrelated gameplay change was made for that timeout.
- `npm run test:e2e` passed **78 tests** on desktop/mobile Chromium, with 14
  expected skips (six device-specific duplicates and eight configured-backend
  checks run separately). This includes demo journeys, keyboard/touch, reload,
  viewport/screenshot, reduced motion, and disabled/answer-free endpoints.
- `npm run test:e2e:server` passed **8 tests** against the production Next.js app,
  real pg transactions, a restricted play role, and a temporary local PostgreSQL
  18 cluster. It seeds 100 synthetic qualified fixtures and eight unique daily
  manifests. Checks include source badges/respondent wording, pre-lock secrecy,
  earned sample/attribution, daily completion, disconnect/idempotent recovery,
  repeat exclusion on restart, content guidance, concurrent locks, and isolation.
  The loopback cluster is stopped and removed; no hosted database is touched.
- Manually reviewed six desktop/mobile screenshots in `docs/evidence/t17/`:
  qualified aiming, completed daily, and waiting for content. Labels, readable
  controls, revealed sample/fixture attribution, and demo recovery link are visible.
  Screenshot review found and removed the leftover “Demo flight” world caption;
  a failing UI test verified the issue, and final rendering uses “Flight view.”
  Source badges and illustrative demo-page disclosures remain explicit. Other
  traces/reports remain in ignored output directories. No physical-device
  performance or production release claim is made.
- Delivery commit reference:
  `:/^T17: gate qualified play on editorial content coverage$` on `main`, under
  the workflow's authorized normal commit/push to the private repository. Only
  example environment values are included; no credentials or generated databases.
- Next unlocked ticket: **T18 — Production QA, privacy, and launch**. This ticket
  does not authorize T18 implementation or a genuine-crowd public launch. Stop
  after T17 and wait for the user's next instruction.

## Standards

Independent fresh-context review: no documented-standard violations. One optional
Fowler smell: the small date-key syntax check duplicates the pre-existing poll
repository helper. Kept local to avoid adding module/configuration machinery for
the Node 22 stripped-TypeScript CLI. This is a judgment call, not a required fix.
Follow-up review confirms no residual actionable documented-standard issues in
the source-aware labels or DST regression. Standards: **0 violations; 1 optional
smell accepted without a change request**.

## Spec

Independent fresh-context review found two issues, both fixed: calendar-day
cooldown arithmetic could shift across DST, and the shared prediction prompt
still described licensed respondents as players. Red/green regressions now test
168-hour expiration under a Los Angeles database timezone and respondent labels
for both qualified source types. Follow-up review: **no residual Spec findings**.
Final caption review also found no residual issue. Standards: **0 violations,
1 accepted optional smell**; Spec: **0 residual findings**. The worst initial Spec
issues (DST arithmetic and respondent wording) are resolved. Reviewers compared
the staged changes to the fixed baseline before the delivery commit.
