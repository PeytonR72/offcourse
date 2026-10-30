# Offcourse

T15 adds an opt-in server poll pipeline with editorial publication and frozen
Daily Five manifests. The game remains demo-only; intake is disabled by default.
See [poll setup and operator commands](docs/poll-pipeline.md).

Guess what humanity thinks to steer a tiny rocket through space.

The prototype includes open practice flights, a five-round Daily Expedition
at `/daily`, and Endless Voyage at `/endless`, with an animated rocket and accessible controls. Percentages are
simulated and clearly labeled **Illustrative results**.

The official plan is [docs/OFFCOURSE_SPEC.md](docs/OFFCOURSE_SPEC.md). The 18
tickets live in [.scratch/offcourse/issues/](.scratch/offcourse/issues/).
Follow [the workflow](docs/agents/workflow.md); each ticket needs explicit user
authorization. GitHub pushes automatically deploy to Vercel for phone testing.

## Setup and local development

Use Node.js **22.14.0 or newer within 22.x** and npm. CI uses Node 22.14.0.
No environment variables or external services are required for T01.

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open <http://localhost:3000>. Edit `src/app/page.tsx` for the home page,
`src/app/layout.tsx` for metadata and the document, and `src/app/globals.css`
for global styles. Tailwind utility classes are available in TSX files.

## Checks

| Command                             | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `npm run lint`                      | Next.js, accessibility, and TypeScript ESLint rules       |
| `npm run typecheck`                 | Strict TypeScript check without emitting files            |
| `npm test`                          | Full Vitest + React Testing Library suite, once           |
| `npm run test:watch`                | Vitest watch mode                                         |
| `npm test -- src/app/page.test.tsx` | One test file                                             |
| `npm run format:check`              | Verify formatting of maintained application/tooling files |
| `npm run format`                    | Format those files                                        |
| `npm run build`                     | Build the production Next.js app into `.next/`            |
| `npm start`                         | Serve the existing production build on port 3000          |
| `npm run test:e2e`                  | Production smoke tests on desktop and mobile Chromium     |

Build **before** running E2E tests. Playwright starts and stops its own production
server on port 3100; leave that port free. The suite checks the HTTP response,
page title, accessible content, honest prototype labeling, browser errors, and
horizontal overflow. It saves a full-page screenshot per viewport in
`test-results/`, an HTML report in `playwright-report/`, and traces on failure.
Open the report with `npx playwright show-report`.

Run the same checks as CI:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

On Linux, use `npx playwright install --with-deps chromium` to install browser
system libraries too. CI uploads reports, screenshots, and failure traces for
14 days. Chromium device emulation checks layout; it does not replace testing
on real phones or other browser engines in later tickets.

## Tests and commits

Vitest discovers `src/**/*.test.ts` and `src/**/*.test.tsx`; browser tests live
separately under `tests/e2e/`. RTL uses jsdom, jest-dom matchers, and cleanup after
each test via `tests/setup.ts`. Test observable behavior through public interfaces.

`npm ci` installs the Husky hook through `prepare`. Before a commit, lint-staged
formats staged files, then the hook runs lint, typecheck, and the full Vitest suite.
Production build and browser tests run in CI. Keep generated output, dependencies,
local environment files, and `.vercel/` out of commits.

TypeScript stays on the 6.0 line and ESLint on 9 to match the parser and plugins
used by `eslint-config-next`. Vite is used only by the Vitest harness; the app
is built and served by Next.js. Pixi world rendering belongs to T06.

T01 verification and retained screenshots are recorded in
[its ticket](.scratch/offcourse/issues/T01-repository-and-test-harness.md).

## Domain rules (T02–T03)

`src/domain/content.ts` defines readonly questions and versioned distributions,
with validators that throw for invalid content fields and numeric metadata.
Crowd percentages may be fractional; player guesses must be integers from 0–100.
Content validation checks structure, not publication eligibility or sample policy.

`src/domain/run.ts` exposes `createRun(id, mode)` and the pure
`transitionRun(run, event)` function. The caller supplies round IDs, questions,
and distribution versions. The round follows:

```text
idle -> answering -> aiming -> locked -> flight -> reveal -> resolved
                     ^                                      |
                     |             answering <--------------+
                     +-- change choice/guess
```

Choose a personal answer before aiming, then explicitly aim before locking.
The guess always predicts YES, including when the personal answer is NO.
Lock pins the input and distribution identity/version. Reveal accepts only the
matching snapshot; resolve appends one immutable result to `completedRounds`.
Out-of-order events and reused round IDs throw. State snapshots are frozen and
transitions leave their inputs unchanged; callers must retain the returned run.

`src/domain/scoring.ts` exposes `scoreRound(mode, guessPercentage, actualPercentage)`.
It returns absolute percentage-point `error`, inclusive ±10 `survived`, and
integer `distance` in light-years. Distance is `max(0, 100 - 5 * error)`, rounded
per round. An endless miss earns zero; a daily miss still earns formula distance.
Survival uses the unrounded error, including fractional crowd percentages.

Reveal attaches the frozen score to the result; `resolve` credits its distance
to `totalDistance` exactly once. Runs start with zero distance and `active`
status. An endless miss changes status to `lost` on resolution and rejects all
further events. Daily misses allow the next round. The five-round daily session
completion, endless streak/records, and pool exhaustion belong to T08/T09.

This module has no browser, clock, randomness, storage, or rendering dependency.
Scheduling and eligibility filtering belong to the content tickets. Reload
persistence and server idempotency will build on these rules in their respective
tickets.

## Demo content (T04)

`src/data/demo-questions.ts` exports a frozen versioned catalog of 40 original
questions with simulated, zero-vote distributions. `src/domain/questions.ts`
exports pure `selectDailyDemo(catalog, at)` and
`selectEndlessDemo(catalog, seenQuestionIds, random)` functions. Daily selection
is stable for the UTC date/version and returns exactly five distinct questions
or explicit unavailability. Endless selection excludes seen IDs and explicitly
reports pool exhaustion. Outputs carry the **Illustrative results** label and
immutable selected snapshots. Invalid or ambiguous content is excluded.

See [the demo content notes](docs/demo-content.md) for the editorial pass,
caller contract, filtering rules, deterministic algorithm, and versioning.
Gameplay UI integration begins in T05.

## Rocket rendering and flight (T06–T07)

Practice now includes a PixiJS 8 rocket, starfield, destination and deterministic
prediction path. `src/world/scene-state.ts` adapts the authoritative round state
without revealing a target before reveal. `mount-scene.ts` owns asynchronous GPU
initialization, updates, resizing and cleanup. Pixi loads only from a client
effect; an SVG view and the DOM controls remain usable if WebGL fails.

The scene renders on state/size changes, caps DPR at 2, and uses nearest filtering
for its original pixel rocket. Browser tests compare canvas screenshots, keep one
canvas across rounds, and play through forced GPU failure. Screenshot baselines
exclude text and allow 1% differing pixels across GPU rasterizers. See the
[T06 evidence](.scratch/offcourse/issues/T06-rocket-rendering-vertical-slice.md).

T07 adds anticipation, ignition, flight, approach, and exact/near landing or miss
drift-out. `src/world/flight.ts` advances the existing domain run from an injected
elapsed time; `flight-frame.ts` supplies the same presentation to Pixi and SVG.
One browser animation-frame loop drives playback and stops on resolution/unmount.
The actual target stays hidden until reveal at 1.2 seconds; playback settles by
1.8 seconds. Skip becomes available after reveal. Reduced motion resolves to a
static trajectory/result, including when the preference changes during flight.
Both paths retain the same locked prediction, distribution and once-only score.
Hidden tabs pause playback until the player explicitly resumes, without replaying
scoring. Reloading a saved Daily or Endless lock settles that prediction once.

Tests cover all three outcomes, skip stability, reduced motion, keyboard flow,
renderer reuse, and the WebGL fallback on desktop and mobile. Retained motion
recordings: [desktop](docs/evidence/t07/desktop-motion.webm) and
[mobile](docs/evidence/t07/mobile-motion.webm). See the
[T07 evidence](.scratch/offcourse/issues/T07-flight-and-reveal-animation-system.md).

T10 adds original expression sprites (idle, anticipation, happy, scared, tumble)
and four thruster frames. Pixi and the SVG fallback share the same pixel art;
missing assets recover with embedded art. See [the art source and regeneration
guide](docs/rocket-art.md) and [frame review](docs/evidence/t10/frames.png).

## Daily Expedition (T08)

Open `/daily` or use the Daily Expedition link below practice. Each UTC day has
the same five frozen demo questions for everyone on the current catalog version.
All five rounds continue after misses, with progress, cumulative distance up to
500 ly, and a per-round results summary. The next reset appears in local time.

`src/domain/daily.ts` owns five-round progression; `daily-repository.ts` accepts
injected browser storage, catalog, and clock. A versioned, dated record pins the
manifest, locked predictions, and current input. Reload reconstructs scores using
the domain rules and settles a locked round once. Completed attempts reopen their
summary; there is no same-day replay. Midnight UTC unlocks a new attempt, including
on an open page. Stale tabs cannot overwrite newer progress.

Daily participation is best effort per browser. Clearing storage resets it;
records do not sync across devices. Unavailable storage uses session memory with
a visible notice; corrupt progress stops with a recovery link to practice. This
remains a demo, with no genuine crowd data or public ranked score.

T08 checks cover 0/500 ly boundaries, five misses, deterministic questions, frozen
reload recovery, replay blocking, UTC rollover, and storage failures. Desktop and
mobile browser screenshots are retained under `docs/evidence/t08/`; see the
[T08 evidence](.scratch/offcourse/issues/T08-daily-expedition-end-to-end.md).

## Endless Voyage (T09)

Open `/endless` or use the Endless Voyage link below practice. Predict within
10 percentage points (inclusive) to keep exploring. The first error over 10
ends the run and earns zero distance for that round. Current streak and distance
appear alongside browser bests, with best streak emphasized. Restart begins a
fresh run and preserves both independent best records.

`src/domain/endless.ts` pins a randomized order of eligible demo snapshots using
the existing selector, with injected randomness. There is no round limit or
repeat within a run; reaching the end of the available pool completes the voyage
without a loss. `endless-repository.ts` saves frozen questions, locked predictions,
current input, and bests together in a versioned browser record. Reload replays
validated inputs through the domain rules and credits a saved lock once. Stale
tabs cannot overwrite newer progress. Unavailable storage uses session memory;
corrupt progress stops with a recovery message and a practice link.

Records are local to this browser and clearing storage resets them. Percentages
remain visibly simulated; no public ranked score or genuine crowd data is claimed.
T09 checks cover 10/11 boundaries, first-miss termination, all 40 unique questions,
explicit pool completion, restart, saved bests, reload, and storage failures.
Desktop/mobile evidence is retained in `docs/evidence/t09/`; see the
[T09 evidence](.scratch/offcourse/issues/T09-endless-voyage-end-to-end.md).

## Mobile and desktop controls (T13)

Choose YES or NO, then drag the large prediction slider. With a keyboard, Tab
through preferences and controls, use arrow keys for 1% steps, Home/End for
0%/100%, and Enter or Space to activate buttons. The percentage always means YES.

Pause holds the current answer, prediction, and flight progress, and silences
feedback. Switching away from the tab pauses automatically; Resume returns focus
to the question or locked prediction. Daily and Endless drafts survive reload;
saved locks resolve once against the same frozen results. Practice is temporary.
Loading and storage-recovery messages remain readable, with a full-size practice
button when saved modes cannot continue.

The layout includes safe-area padding and a shorter world view on phone
landscape screens. The UX browser matrix covers 360px, iPhone-sized 393px, 768px
tablet, 1440px desktop, and 844×390 landscape layouts across all three modes,
alongside touch dragging, keyboard focus, pause/resume, loading, error recovery,
and saved input. These are Chromium emulations; physical-device and other-engine
profiling remain part of launch QA.

## Sharing and local records (T14)

Complete the Daily Expedition to share an anonymous summary with its UTC date,
distance, and prediction accuracy. Accuracy means 100 minus mean absolute
percentage-point error, displayed to one decimal place when needed. The summary
includes the **Demo · Illustrative results** disclosure and omits personal
answers, question prompts, and identifiers. Share opens native sharing where
available; Copy summary uses the clipboard. If copying is blocked, the selectable
text remains available for manual copying. Canceling native share does not copy.

Completed daily attempts reopen the same summary after reload. Play practice or
Endless Voyage while waiting for the next UTC daily reset; an ended voyage can
restart or switch to Daily. Independent endless best streak and distance persist
across attempts. Sound, haptics, and reduced-motion preferences remain local too.

When browser storage is blocked or fills up, current progress and bests stay in
memory until this page closes or reloads, with a session-only notice. Existing
corrupt records are preserved for recovery. Clearing browser storage resets
records; nothing syncs across devices.
