# Real poll pipeline (T15)

The game remains a **Demo · Illustrative results** experience. This pipeline is
server infrastructure for future qualified content. It does not enable real
scored play, collect live responses by default, provision a service, or import
any real poll. Server-backed play and anti-spoiler manifests belong to T16;
content coverage and the switch to real scoring belong to T17. T16 is now documented
in [server-backed play](server-play.md); it remains disabled by default.

## Storage and setup

`db/migrations/001-polls.sql` targets PostgreSQL 16 or later. It stores editorial
questions, consented votes, shared rate limits, sourced counts, immutable
distribution snapshots, and immutable ordered Daily Five manifests in the
private `offcourse_poll` schema. Simulated content is rejected by the schema and
continues to live only in the existing demo catalog and selectors.

Use an approved database, a server-side pooled connection URL with TLS, and
environment-specific credentials. No provider has been selected or provisioned.
Do not apply these operations to a production database without the normal
environment authorization. Back up the database before migrations.

Copy `.env.example` to the ignored `.env.local`. Keep `POLL_INTAKE_ENABLED=false`.
`POLL_DATABASE_URL` is the only credential the editorial CLI needs. With a trusted
operator connection, run:

```sh
npm run polls -- migrate
```

The CLI uses the repository's Node 22.14 runtime and its experimental TypeScript
stripping flag. Migrations run on one dedicated connection in a transaction,
serialized by a database advisory lock. A checksum ledger prevents editing an
already applied migration; add a new numbered SQL file for changes. Re-running
the command skips applied migrations. A failure rolls back the transaction.

For the deployed intake, use a separate non-owner database role. An administrator
can grant it only the following capabilities (replace `offcourse_intake` with
the configured role name):

```sql
GRANT USAGE ON SCHEMA offcourse_poll TO offcourse_intake;
GRANT EXECUTE ON FUNCTION offcourse_poll.submit_vote(text,text,text,text,timestamptz)
  TO offcourse_intake;
```

No table permissions or publication functions are needed by intake. The vote
function runs with its owner's permissions and a fixed search path. Functions
are revoked from PUBLIC. Editorial commands require a separate trusted operator
connection; never expose them as anonymous endpoints. Keep all credentials out
of `NEXT_PUBLIC_*` and source control. The runtime pool has bounded connections
and connection/query timeouts; persistent data and rate limits live in PostgreSQL.

## Editorial workflow

Create a JSON question containing `id`, `prompt`, `yesLabel`, `noLabel`, `category`,
and `sourceType` (`first_party` or `licensed_external`). IDs use lowercase letters,
digits, and hyphens, up to 80 characters. The question starts pending:

```sh
npm run polls -- create-question question.json
```

Before approving, review a single unambiguous binary proposition, faithful labels,
no targeted harassment, no sensitive personal information, and no discriminatory
demographic assumptions. Write the review rationale in a text file. For sourced
content, also check the exact wording, independent respondent counts, provenance,
permission to reuse, and attribution. Approval is an editorial attestation;
software cannot verify a license or prove that two browser installations are two
different humans.

```sh
npm run polls -- review question-id approved review-note.txt
# To stop intake and future publication:
npm run polls -- review question-id rejected rejection-note.txt
```

First-party questions must be approved before accepting votes. The initial
qualification policy counts one explicit `poll-v1` consented vote per installation
per question. Installation identity is best effort, with no fingerprinting. Review
collection quality before publishing; do not treat anonymous deduplication as
proof against deliberate vote manipulation.

For `licensed_external`, import JSON with integer `yesVotes` and `sampleSize`,
nonempty `attribution`, an HTTPS `citationUrl`, and nonempty `permission` and
`verification` notes. Use counts for the exact binary wording; do not reconstruct
counts from a rounded published percentage. Synthetic fixtures in tests are not
real sources. Importing or replacing evidence resets moderation to pending, so
approval must follow the import:

```sh
npm run polls -- import-source question-id source.json
npm run polls -- review question-id approved review-note.txt
npm run polls -- publish question-id
```

Publication requires approval and at least **100** qualified responses. This is
the initial product policy, a modest sampling floor rather than a statistical
confidence guarantee. The percentage is `100 * yesVotes / sampleSize`, without
rounding the target to an integer; player guesses remain integers. For example,
125 YES of 200 gives 62.5%. First-party attribution identifies the consented
Offcourse poll; licensed attribution includes its citation URL. Source evidence
and editorial notes are retained for operator review.

Each publication allocates `question-id:vN`, freezes the question wording,
percentage, sample size, source attribution, and time, and marks the distribution
eligible. Database triggers reject UPDATE, DELETE, and TRUNCATE of snapshots and
manifests. Later votes or source imports can produce a new version but cannot
rewrite an issued target. Trusted database owners can change schema protections;
these controls protect normal application operations, not a malicious DBA.

## Daily publication

Prepare a JSON array of exactly five published distribution IDs in the desired
order. They must identify five different currently approved questions. Publish
once per explicit UTC date key; there is no fallback to simulated data or partial
daily and no replacement of an already published date:

```sh
npm run polls -- publish-daily 2026-10-30 ordered-snapshot-ids.json
npm run polls -- daily 2026-10-30
npm run polls -- snapshot question-id:v1
```

These inspection commands contain answers and are for trusted operators only.
The [T17 content strategy](content-strategy.md) adds atomic seven-day publication,
seven-date repeat protection (including single-day commands), coverage checks,
retirement controls, and quality reports. Apply `003-content.sql` before use.
They are not client play endpoints. Rejection of a question blocks future
publication while preserving existing snapshots and manifests for already locked
play. Daily dates are stored as dates rather than local-time timestamps.

## Optional vote intake contract

After explicit approval to start live collection, set a stable, random
`POLL_VOTE_SECRET` of at least 32 characters, configure the restricted
`POLL_DATABASE_URL`, and set `POLL_INTAKE_ENABLED=true`. All three are required.
Without configuration the route returns 503, and demo play continues normally.

`POST /api/polls/<question-id>/votes` accepts JSON only, up to 2048 bytes including
streamed requests. An Origin header, when supplied, must match the request origin.
The exact body is:

```json
{
  "installationId": "9c158c52-d7aa-4c80-88ee-f85fe1994b74",
  "answer": "YES",
  "consent": { "accepted": true, "version": "poll-v1" }
}
```

A future collection UI must explain the exact proposition and ask for affirmative
consent before sending: “I agree to store my anonymous YES/NO response and a
pseudonymous installation key to prevent duplicate votes, and include my response
in aggregate published poll results.” No prechecked consent. `poll-v1` records
acceptance of that disclosure; a changed disclosure needs a new version and
matching migration. No collection UI or automatic gameplay submission is added
in T15.

The installation ID must be a random UUID v4. The server HMACs its canonical
lowercase value with the secret before storing it. Raw IDs, IPs, fingerprints,
names, and emails are not stored. Extra JSON properties are rejected. Do not
rotate the hashing secret casually: changing it resets deduplication identity.

Responses contain a status only, never totals, percentages, or a target version:

| HTTP      | Status / meaning                                           |
| --------- | ---------------------------------------------------------- |
| 201       | `accepted`                                                 |
| 400       | `invalid` body, ID, answer, or consent                     |
| 403       | `invalid`, cross-origin request                            |
| 404       | `unavailable`, unknown/unapproved/non-first-party question |
| 409       | `duplicate`, already answered                              |
| 413 / 415 | `invalid`, oversized body / wrong media type               |
| 429       | `rate_limited`, with `Retry-After: 60`                     |
| 503       | `unavailable`, disabled configuration or database failure  |

Every response is `Cache-Control: no-store`. The shared database throttle allows
10 structurally valid attempts per installation per minute, including duplicates
and unavailable questions, across server instances. Failed consent/body checks
never insert a vote. New UUIDs can evade installation limits; there is no claim
of Sybil resistance. Launch-level network abuse controls and retention review
remain T18. Infrastructure access logs are outside this application's row storage
policy and need review before real collection.

## Verification and limits

`npm test -- src/server` runs the migration and repository/HTTP contracts against
PGlite's PostgreSQL engine, including threshold calculations, moderation,
attribution, immutable versions/manifests, database role permissions, deduplication,
rate limits, migration reruns/rollback, and invalid requests. No live data or
external service is used. PGlite is a test-only dependency; production uses `pg`.
A multi-process hosted-PostgreSQL test and provider/TLS configuration remain
environment verification work before enabling intake. The local Docker engine
was unavailable during T15 validation.

The default production Playwright smoke verifies disabled intake and the existing
mobile/desktop demo journeys. There is no anonymous route to publish, inspect
distributions, or download a daily manifest with answers. T16 supplies the
server-backed, lock-before-reveal play flow.

References: [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html),
[trigger functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html),
[parameterized pg queries](https://node-postgres.com/features/queries), and
[PGlite](https://pglite.dev/docs/about).
