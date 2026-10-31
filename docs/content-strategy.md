# Qualified content strategy (T17)

The home page, `/daily`, and `/endless` remain explicitly simulated demo modes.
The opt-in `/play` preview serves qualified frozen polls only. This policy adds
a coverage gate to that preview; it does not authorize live sourcing, collection,
production configuration, or public launch. Release approval remains T18.

## Coverage and repeat policy

Before **either kind of new scored run**, the server checks its UTC date:

- Seven consecutive immutable Daily Five manifests must exist, including today.
  Each must still have five approved, non-retired, qualified questions.
- At least **100 distinct questions** must have eligible frozen snapshots and
  current editorial approval. Multiple distribution versions count once.
- Daily questions cannot repeat within seven UTC dates, including against
  previously published neighboring dates. A gap of exactly seven dates is allowed.
  Legacy calendars with recent repeats cannot open scored play after migration.

The initial 100-question floor provides a finite, meaningful endless pool and a
seven-day daily runway (35 different daily questions). Daily and endless may
draw from the same catalog. This is an operational starting policy, not evidence
of statistically representative polls or unlimited content. Sampling still needs
at least 100 independently qualified responses per question, editorial approval,
faithful wording, and documented attribution/permission as described in
[the poll pipeline](poll-pipeline.md). No simulated snapshot can enter this schema.

Endless pins the latest eligible version of each question in stable ID order,
excluding questions this installation **locked in either scored mode during the
previous seven elapsed days**. The window uses server lock times, including
losing guesses. Exactly seven elapsed days releases a question. Unanswered
questions are not consumed by opening a manifest. Existing runs remain pinned,
so parallel issued runs can overlap; recent exclusion applies when starting a
fresh run. No account or cross-device/fingerprint tracking is added.

Once a run starts, retirement, new versions, coverage shortages, or UTC rollover
cannot replace its targets or block recovery of earned results. Reaching the
end of its finite pinned pool is `exhausted`, distinct from `lost`. If all current
questions are recent, a fresh endless request returns an explicit exhausted-pool
response with no run or score. A global coverage shortage returns `not_ready`;
neither case silently substitutes simulated data or invents a loss. The browser
explains availability and offers a retry; demo practice remains available.

`003-content.sql` adds the policy without editing prior migrations. Historical
results without lock timestamps conservatively enter the cooldown at migration
time. New locks use the injected server clock. Existing manifests/results stay
immutable. Dates are explicit `YYYY-MM-DD` PostgreSQL dates; timezone conversion
uses the server's UTC instant, never a client-supplied date.

## Editorial cadence and tools

Use only the trusted operator connection, never anonymous routes or a browser.
Apply migrations first. With real sourcing/collection separately approved:

1. Maintain a review queue of clear, original binary propositions. Check wording,
   safety, provenance, consent/license evidence, and independent counts before
   approving and freezing a snapshot. Use a new question ID for changed meaning.
2. Each week prepare seven arrays of five distribution IDs in their intended
   order. Use 35 distinct questions and check the preceding/following calendar.
   Review topic variety and avoid a daily slate dominated by one category.
3. Publish at least a week ahead, then replenish the farthest date **daily** so
   tomorrow still has seven days ready at 00:00 UTC. Publishing only once per week
   would close new scoring on the eighth uncovered date. Missing coverage fails
   closed; issued games continue. Do not repair an immutable date in place.
4. Check quality and remaining coverage daily, and after a retirement or source
   change. Replenish approved questions before the distinct endless pool falls
   below 100. Recent-history exclusions may still exhaust an individual pool.

```sh
npm run polls -- migrate
npm run polls -- publish-week 2026-11-01 seven-days.json
npm run polls -- coverage 2026-11-01
npm run polls -- quality
npm run polls -- retire question-id reason.txt
```

`seven-days.json` is an array of seven arrays, each containing five snapshot ID
strings. `publish-week` publishes all seven in **one database transaction** or
none. Publication is serialized with single-day publication, so two editors
cannot bypass repeat checks by racing. Existing `publish-daily` commands also
enforce the repeat policy. Re-publishing an existing date fails; `daily` retrieves
its original frozen content. Operator inspection outputs may include answers.

`coverage` returns `ready`, `dailyDays`, and `endlessQuestions`. It is an
operational check, not release approval. Runtime requests independently check it.

`quality` returns each question's current moderation/retirement, latest published
sample size, official scored attempt count, mean absolute percentage-point error,
and percentage of attempts outside ±10. No attempts means null error/miss metrics,
not zero quality. Metrics combine frozen versions and both scored modes and
include losing rounds. They measure prediction behavior, not whether respondents
or wording are valid; anonymous repeat play can bias them.

Review ambiguity reports, source corrections/license withdrawal, unusual vote
patterns, low-confidence samples, and unexpectedly high error/miss rates. Inspect
the exact wording and evidence before deciding; no automatic retirement threshold
is inferred from player difficulty. Retire questionable content with a nonempty
reason. Retirement records its time/reason, rejects future intake/publication and
new selection, and cannot be reversed through approval/import commands. A revised
proposition needs a new ID and qualification. A scheduled retirement can reduce
coverage until its immutable dates pass; use demo-only operation while repairing
future coverage. Previously issued targets retain their frozen values.

## Honest display and transition

Qualified rounds display **Offcourse poll results** for first-party polls and
**Licensed poll results** for licensed sources. Sample size and source attribution
appear only with the earned reveal. Licensed respondents are not described as
Offcourse players. Demo surfaces keep **Illustrative results**. The backend never
falls back from real to simulated scoring inside a run.

Keep intake/play disabled until the approved database, qualified evidence,
operator calendar, coverage check, and restricted-role verification are ready.
T18 still owns production QA, privacy review, deployment/release approval, and
physical-device performance measurement. This ticket seeds **only synthetic test
fixtures in isolated local test databases**, with explicit fixture attribution.

## Verification

`npm test -- src/server/content.test.ts src/server/play.test.ts` covers atomic
weeks, stable frozen days, recent repeats across versions and out-of-order dates,
sample/coverage floors, retirement, legacy migration, UTC offsets/year rollover,
official quality metrics, no duplicate questions, cooldown and honest exhaustion.
The UI tests cover source badges without pre-lock samples, availability guidance,
and existing disconnect recovery. `npm run test:e2e:server` checks the production
server and restricted role against an isolated local PostgreSQL cluster with
100 synthetic questions and eight unique daily manifests. No hosted data is used.
