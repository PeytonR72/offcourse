# Demo content and scheduling (T04)

`src/data/demo-questions.ts` contains 40 original English prompts in catalog
version 1, five each in space, everyday, food, travel, stories, play, nature, and
making. All percentages are authored examples. **Illustrative results** must
remain visible wherever this catalog is used. There are no collected votes:
every distribution has sample size zero, simulated attribution, and `ineligible`
status. `published` marks a prompt as available in the demo; it does not qualify
its distribution for public ranked play.

## Editorial pass

An agent editorial pass reviewed all 40 prompts on 2026-10-29 against the intake
rules in specification section 3. Each prompt asks one explicit binary question,
uses Yes/No labels, and keeps the predicted percentage on the YES axis. Topics
are ordinary preferences or hypothetical choices. No prompt requests sensitive
personal information, targets a person or group, assumes demographic traits, or
presents a factual claim as a poll. The pass also checked distinct wording and
IDs and that none of the invented percentages or zero sample sizes imply real
respondents. This records an agent review, not an external human sign-off.

## Pure selection interface

`selectDailyDemo(catalog, at)` takes an explicit clock value and uses its UTC
date key, independent of the player's local timezone. It returns either a
`ready` Daily Five or `unavailable` with `insufficient_questions` and the valid
question count. A partial daily is never issued. The output includes the date,
catalog version, and demo label.

Catalog version 1 sorts valid entries by question ID using code-unit order,
hashes `YYYY-MM-DD:version` with 32-bit FNV-1a, and shuffles with Fisher-Yates
using a 32-bit linear congruential generator (1664525, 1013904223). Input order,
local timezone, wall-clock time within the UTC day, and ambient randomness do
not affect the result. Different dates or versions may select different ordered
sets; consecutive days can share questions. Recent-repeat policy belongs to T17.

`selectEndlessDemo(catalog, seenQuestionIds, random)` removes every previously
seen question ID before drawing from the remaining pool. Pass the IDs of all
questions already issued in that run, including the current question, and retain
that history between calls. The injected random source returns a finite value
in `[0, 1)`; invalid draws throw. Empty pools return `exhausted` with
`pool_exhausted`, independently of scoring or loss. An exhausted pool needs no
random draw. Run completion, restart, storage, and UI integration belong to
T08/T09 and later tickets.

Both selectors validate content structure and matching question/distribution
identities and accept only published simulated snapshots with zero sample size
and ineligible distributions. Conflicting repeated question or distribution IDs
among otherwise valid entries are all excluded; selection never chooses an
arbitrary duplicate. Selected questions and distributions are copied and frozen
so later caller edits cannot change an issued target. The exported seed is also
deeply frozen.

## Versioning and release boundary

Keep a catalog version's contents, IDs, distribution values, and scheduling
algorithm fixed. Changes require a new catalog version; changed distributions
also require a new distribution ID/version. Retain older catalogs when persisted
attempts need them. These are reproducible client-side demo schedules, not the
server-authoritative published manifests planned for T15/T16. Demo snapshots
include the answer values and can be inspected by a browser client.

No real-result ingestion, qualification policy, ranked modes, or live sourcing
is implemented here. The selectors are deliberately named for demo use so a
later real-content path must apply its own eligibility and anti-spoiler rules.
