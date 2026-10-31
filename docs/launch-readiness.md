# T18 launch readiness and operations

Offcourse remains an **explicitly labeled demo**. The `/daily` and `/endless`
routes use illustrative percentages. `/play` is a separate optional qualified
server preview. No genuine-crowd release is approved by this ticket command.
Synthetic qualified test fixtures are never publishable crowd evidence.

## Release gates

- Run format, lint, typecheck, unit/integration tests, build, desktop/mobile E2E,
  and the isolated PostgreSQL server E2E suite. CI now runs both browser suites.
- Review privacy, local storage failure, keyboard flow, focus, motion controls,
  and canvas failure. Automated axe audits supplement visual/keyboard checks;
  they do not establish complete accessibility conformance. Real screen-reader
  and physical-phone QA remain manual gates.
- Run `npm run qa:profile` against a running production build on port 3100
  (`node node_modules/next/dist/bin/next start --port 3100`). Optionally set
  `PROFILE_BASE_URL` to a verified deployment origin. Reports and six screenshots
  go to ignored `test-results/flight-profile/`. Keep a dated copy in evidence.
  The probe measures requestAnimationFrame cadence across exact, near and missed
  flights; this is a main-thread responsiveness proxy, not GPU presentation FPS.
  Record device, browser, power mode, thermal conditions and actual measurements.
  The 4× throttled Pixel profile runs on desktop hardware, not a physical phone.
- Before genuine scoring, follow `content-strategy.md`: obtain approved, genuine
  data with verified sourcing and at least 100 qualified independent respondents
  per distribution; prepare seven daily manifests and 100 distinct endless
  questions; inspect trusted CLI `coverage` and `quality` reports. Keep answers
  server-only until lock. Never deploy synthetic server-test fixtures.
- Obtain explicit genuine-crowd release approval before enabling the backend or
  changing demo branding. This work provisions no database, live collection,
  paid monitoring service or third-party analytics SDK.

## Privacy and monitoring

Every page links to `/privacy` and describes local storage in its footer. The
notice covers drafts, attempts, bests and preferences, optional installation
keys, keyed server hashes, consented polling, aggregate snapshots, sharing,
hosting metadata and the absence of automatic server deletion. Browser reset
does not remove server records. No app fingerprint, session replay, advertising
tracker or raw exception-reporting endpoint is introduced.

Use the existing project's Vercel runtime logs and Observability to inspect
request status, latency and generic errors. Do not attach request bodies,
installation IDs/hashes, personal answers, guesses, database URLs or secrets to
logs or exports. Platform connection metadata is handled by the host, as the
notice explains. [Vercel Observability](https://vercel.com/docs/observability)
provides infrastructure and function diagnostics; availability of individual
features depends on the account. No paid upgrade or new alert subscription is
enabled here.

`GET /api/health` is an on-demand, uncached readiness probe with no cookies or
player writes. Poll at a modest interval (for example once per minute) with an
operator's existing monitoring service if desired; no recurring job is created.

| HTTP | Body `play`           | Operator interpretation                                       |
| ---- | --------------------- | ------------------------------------------------------------- |
| 200  | `demo`                | Optional play disabled; demo is healthy                       |
| 200  | `ready`               | Qualified coverage query passed; this is not release approval |
| 503  | `waiting_for_content` | Database reachable, qualified coverage inadequate             |
| 503  | `unavailable`         | Requested play has missing config or failed database query    |

Only `status` and `play` are returned: no questions, targets, sample sizes,
credentials or participants. A content shortage does not claim the demo is
broken; operators should interpret the body. Existing API failures fail closed
with no score or simulated substitution. The UI holds pending locks for an
idempotent retry; unexpected route errors offer retry and demo recovery. The
static SVG world and DOM controls remain available when WebGL fails.

## Deploy and smoke

1. Verify project `offcourse`, team `team_xhJ89qrqc3QBjcS7vn8veIcp`, repository
   `PeytonR72/offcourse`, branch and exact commit. Record the current READY
   production deployment as a rollback candidate. Keep deployment protection.
2. A normal workflow-authorized push to `main` deploys the demo. Verify GitHub
   CI and Vercel READY state for that commit; a push alone is not deployment
   evidence. Do not change hosted secrets or enable qualified play as a fallback.
3. Set `SMOKE_BASE_URL` to the verified deployment origin and run
   `npm run test:e2e:production`. This runs fresh local demo records only:
   home/disclosure, health, privacy/audits, daily 0/500 completion and replay,
   endless inclusive 10/11 survival/loss and restart on desktop/mobile Chromium,
   and unavailable/answer-free server endpoints using invalid payloads. Keep reports
   private and retain selected screenshots and the deployed commit in evidence.
4. If the URL requires Vercel authentication, use approved Vercel access tooling
   or the signed-in browser. Do not disable protection or commit bypass tokens.

## Fallback and rollback

For a backend incident, preserve saved pending locks and retry after restoring
service; do not issue replacement simulated scores. Demo routes remain separate.
If qualified play must be disabled, a trusted operator sets `PLAY_ENABLED=false`
in the intended production environment and redeploys with approval. Restore the
same HMAC secret to retain participation identity. Do not rotate it incidentally.

For a bad release, inspect the recorded last-known-good READY deployment and
project, then execute an authorized rollback via Vercel's dashboard or
`vercel rollback <deployment-url> --scope peytonr7272-gmailcoms-projects`.
Re-run the production smoke and inspect runtime errors. A code rollback does not
revert database migrations or environment changes; this ticket adds no migration.
Do not delete published snapshots or roll back schema blindly. Vercel rollback
also disables automatic production domain assignment until a subsequent
promotion; verify assignment before resuming releases. See the official
[rollback guide](https://vercel.com/docs/deployments/rollback-production-deployment).
No production rollback is executed as a drill. Local tests cover GPU failure,
storage failure, offline lock recovery and unavailable backend behavior.

## Remaining human launch QA

On an actual mainstream phone, open the deployed demo in portrait and landscape,
play daily through completion and endless through a survival and miss, try mute,
reduced motion and pause/tab return, and inspect safe areas/touch/readability.
Use browser remote performance tools to record frame cadence during several
flights, including warm-up and a sustained session; report actual results against
the 60 FPS target without substituting desktop emulation. Repeat basic controls
with a screen reader. Record device/OS/browser and any issue before marking the
physical-device gate complete. Genuine data, release approval and naming
clearance remain separate launch decisions in the official spec.
