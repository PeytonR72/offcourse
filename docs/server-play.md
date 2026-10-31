# Server-backed play (T16)

The existing practice, `/daily`, and `/endless` modes remain **Demo · Illustrative
results**. This ticket adds an opt-in `/play` preview and server contracts for
qualified polls. It does not source live content, enable production scoring, or
authorize public launch. [T17 content strategy](content-strategy.md) now gates new
scored runs on a seven-day calendar and 100 distinct qualified endless questions;
launch approval remains T18.

## Configuration

Apply the numbered migrations with the trusted editorial connection described in
[the poll pipeline](poll-pipeline.md). `002-play.sql` adds persistent participation,
immutable round results, and shared request limits. Do not edit an applied migration.

Keep `PLAY_ENABLED=false` until an approved database and qualified content exist.
When approved, configure a separate server-only `PLAY_DATABASE_URL` and a stable
random `PLAY_SECRET` of at least 32 characters. All three settings are required.
The secret HMACs a random installation UUID; raw installation IDs, IP addresses,
and fingerprints are not stored in these tables. Rotating it changes participation
identity. Browser storage loss can evade participation limits; this is best effort,
with no account, global leaderboard, or fraud-proof claim.

The runtime role needs only these privileges (replace `offcourse_play` as needed):

```sql
GRANT USAGE ON SCHEMA offcourse_poll TO offcourse_play;
GRANT SELECT ON offcourse_poll.questions, offcourse_poll.snapshots,
  offcourse_poll.daily_manifests, offcourse_poll.eligible_snapshots TO offcourse_play;
GRANT SELECT, INSERT, UPDATE ON offcourse_poll.play_runs,
  offcourse_poll.play_limits TO offcourse_play;
GRANT SELECT, INSERT ON offcourse_poll.play_results TO offcourse_play;
GRANT EXECUTE ON FUNCTION offcourse_poll.snapshot_json(text) TO offcourse_play;
GRANT EXECUTE ON FUNCTION offcourse_poll.content_coverage(date) TO offcourse_play;
```

This is a trusted server role that can read targets internally; its credentials
must never reach a browser or `NEXT_PUBLIC_*`. It cannot publish content or mutate
published snapshots. Keep intake, editorial, and play credentials separate. The
connection should use the provider's pooled TLS URL. The pool caps connections at
three and applies connection/query timeouts. Every transaction uses one checked-out
connection for BEGIN, queries, and COMMIT/ROLLBACK.

## HTTP contracts

Both endpoints accept JSON up to 2048 bytes, including streamed bodies. Origin,
when present, must match. They reject extra properties. Every response, including
errors, is `Cache-Control: no-store`; neither endpoint supports answer-reading GETs.

`POST /api/play`:

```json
{
  "installationId": "9c158c52-d7aa-4c80-88ee-f85fe1994b74",
  "requestId": "3ad8abf2-cb3a-4992-9c0d-905a5aedf233",
  "mode": "daily"
}
```

IDs must be UUID v4. Mode is `daily` or `endless`. A successful reply is
`{status: "ok", play: PlayManifest}`. An unplayed manifest includes frozen question
wording, labels, category, source type, distribution ID/version, and no distribution
values, vote counts, sample size, attribution, or target-dependent trajectory data.
`results` is empty until a lock commits. Resuming returns only previously earned
results and safe question fields for remaining rounds.

Daily uses the server's UTC date and the published immutable ordered Daily Five;
it never accepts a client date or falls back to demo data. A second request ID
resumes the same installation/day. Reusing yesterday's request ID starts today's
participation with a new run ID. Previously issued runs stay pinned and lockable
across midnight. Endless pins the latest published version of every currently
approved, non-retired question, one per question, in stable question-ID order,
excluding this installation's locks in either mode during the past seven days.
Reusing its request ID resumes the same run; a fresh UUID starts another voyage.
New runs require T17 coverage. Insufficient global coverage returns 503
`not_ready`; a fully recent endless pool returns 200 `exhausted` with no run.
Issued runs resume before checking coverage and remain lockable after retirement.

`POST /api/play/<run-id>/lock`:

```json
{
  "installationId": "9c158c52-d7aa-4c80-88ee-f85fe1994b74",
  "roundIndex": 0,
  "answer": "no",
  "guessPercentage": 57
}
```

Index is zero-based, answer is lowercase `yes`/`no`, and guess is an integer
0–100, always predicting YES. The server checks ownership, order, and active state,
loads the pinned snapshot internally, and calls the existing `scoreRound` function.
It atomically saves the locked input, official distribution/version, score, and run
totals. No client distribution, version, score, total, or survival claim is accepted.
The losing endless round earns zero. Daily continues five rounds despite misses;
endless distinguishes `lost` from `exhausted`. New publications cannot alter a run.

Identical retries return the current official manifest without another credit.
Changing a locked input returns 409; for that owned, already-earned round only,
the reply includes the official play record so a stale tab can recover it.
Out-of-order/post-loss locks return 409 without a new target. Unknown/foreign runs
return `unavailable` with no results. Unsupported media is 415, malformed input 400,
cross-origin 403, oversized body 413. Database failures and disabled configuration
return 503 with no private error details. Installation limits allow 30 valid requests
per minute across start/lock, instances, retries, and unavailable runs. Excess
returns 429 and `Retry-After: 60`. New IDs can evade this best-effort limit.

## Browser recovery

`/play` selects daily; `/play?mode=endless` selects endless. The page discloses
storage/identity limitations and that gameplay choices are not collected as votes.
It uses the existing accessible round controls, rocket, pause, and flight/reduced
motion presentation. It reveals sample size and attribution with the earned result.

Unlocked input is saved locally. Lock saves an immutable pending payload **before**
the request. A lost response or timeout holds the prediction and hides results;
Retry connection or reload sends exactly the same payload. Once the official
record arrives, the existing flight presentation can reveal it. The server's unique
round key and transaction prevent duplicate credit even if the first request
committed. Conflicting tabs recover the official locked record. If durable storage
cannot save the pending request, no request is sent; demo practice stays available.

## Verification

- `npm test -- src/server/play.test.ts src/app/play/server-play.test.tsx` exercises
  the repository/HTTP contracts through PostgreSQL semantics in PGlite, and browser
  input/reload/disconnect recovery through the fetch seam.
- Build first, then `npm run test:e2e:server`. This requires local PostgreSQL binaries
  (Windows defaults to PostgreSQL 18; set `PG_BIN` elsewhere, or use PATH on Unix).
  It creates an isolated temporary loopback-only cluster, applies migrations, seeds
  **synthetic test fixtures only**, grants the restricted play role above, and runs
  the production Next.js server on port 3101. It checks desktop/mobile journeys,
  answer-free responses, real concurrent requests, cross-installation isolation,
  official scoring, and a committed lock whose response is lost before reload.
  It stops and removes only its own temporary cluster. Screenshots and traces go
  to ignored `test-results/`; selected screenshots are retained in `docs/evidence/t16/`.
- `npm run test:e2e` remains the unconfigured production/demo smoke suite on port 3100. Backend-specific tests are skipped there. No hosted data/service is used.

Physical-device profiling, production provider/TLS behavior, network-level abuse
controls, operational retention, and content/release approval remain later work.
Application rows do not log raw IDs; infrastructure access-log privacy still needs
launch review.

References: [node-postgres transactions](https://node-postgres.com/features/transactions),
[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).
