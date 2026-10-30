# OFFCOURSE — Implementation Specification

Status: Build-ready v0.1 · Working title: Offcourse (not trademark/domain cleared)
Target: Responsive browser game for mobile and desktop; no accounts, no required sign-in.
Theme: A tiny, expressive pixel-art rocket navigating the galaxy by predicting what percentage of people chose an answer. Original art direction inspired by the polish and progression of cozy indie games; do not copy Krillion art, UI, code, or characters.

## 1. Product promise

One-line pitch: Guess what humanity thinks to steer a tiny rocket through space. One bad correction ends your endless voyage.

Two launch modes only:

• Daily Expedition: Five globally shared binary-choice questions per UTC day. Everyone gets the same question order and frozen answer distributions. The player chooses their own YES/NO response and guesses the percentage of the crowd who picked YES. All five rounds finish regardless of misses. Each round earns distance based on error; daily total is the headline score. Anonymous share card summarizes total distance and accuracy. One ranked attempt per browser installation per day (best-effort, not fraud-proof).
• Endless Voyage: Answer and predict one question at a time. A guess survives iff abs(guessPercentage - actualPercentage) <= 10 percentage points (inclusive). Any miss (>10) immediately ends the run. Record consecutive successful destinations; show longest streak prominently, total distance as a secondary stat. No arbitrary end until the eligible question pool is exhausted; if exhausted, end gracefully with an explicit completion state, not a fake loss. Do not repeat a question within a run.

No account means no email, OAuth, password, profile screen, or blocking onboarding. Browser-local identity is best effort only; records do not sync across devices, clearing storage resets local records, and public global leaderboards are out of scope until anti-abuse is considered.

### Experience principles

1. The rocket is protagonist, not ornament. Choice/aim/launch/reveal all occur with the world visibly present.
2. Aiming has a consistent, understandable relationship to percentage prediction. Never use the animation to imply the selected number was wrong before the reveal.
3. Cozy charm: small rocket, porthole face/eyes, breathing idle, eager thruster, subtle wobble, squishy anticipation, expressive celebration/tumble.
4. Pixel-textured art + smooth interpolated camera/position/rotation. Preserve crisp sprite pixels, target 60 FPS on mainstream phones, no need to rigidly pixel-snap all world motion.
5. Short interaction cycle, readable questions, large touch controls, motion/audio toggles, accessible keyboard/gamepad not required (keyboard yes).
6. No invented crowd data presented as real. Early prototype clearly says simulated results. Only use eligible, frozen, adequately sampled real polls in public scored modes.

## 2. Core mechanic and scoring

1. Display a binary-choice question and a player’s own YES/NO response selector.
2. Ask: “What percentage of players chose YES?” The 0–100 control always means YES, regardless of personal choice. Personal choice never reverses this axis. Choose integer percentages.
3. Before submit: aiming reticle/trajectory responds to slider, but target-correctness cues remain hidden.
4. On submit, persist the locked percentage; animate ignition, trajectory, and reveal. Show actual percentage and absolute error.
5. Flight judgment: error = abs(guess - actual); survive endless iff error <= 10. Exactly 10 succeeds; 11 fails. This is percentage-point difference, not relative percent difference.
6. Distance: roundDistance = max(0, 100 - 5 * error) light-years, rounded to an integer. Exact = 100 ly; error 10 = 50 ly; error 20 = 0 ly. Daily total is sum across 5 questions. Endless survived-round distance is included in running total; the losing round earns 0 and ends run. This formula is a proposal to revisit after playtesting, but must remain centralized and unit-tested.
7. Visual trajectory: deterministic presentation-only mapping predicted percentage -> normalized launch offset; actual answer chooses the ideal path; error magnitude picks perfect/landing-graze/miss animation. Random destination geography cannot affect win/loss.
8. Pause or tab away before lock: preserve current input. On reload after lock, never create a second credited answer or replay different data.

## 3. Data contract and honest scoring

Use versioned schema: Question { id, prompt, yesLabel, noLabel, category, status, sourceType, distributionId } and Distribution { id, questionId, yesPercentage, sampleSize, frozenAt, sourceAttribution?, eligibilityStatus, version }.

• Source types: simulated, first_party, licensed_external. simulated allowed only in explicitly labeled demo/practice, not public ranked daily/endless release.
• Real scored content: frozen results, transparent sample size and sourcing, preferably min 100 qualified independent votes per question (initial eligibility policy; document why and refine statistically). Never update a live player’s target mid-run. Use server-authoritative frozen distribution IDs/versions.
• Question intake: clear language, one non-ambiguous binary proposition, no targeted harassment, no sensitive personal data, no discriminatory demographic assumptions; editorial review before publication.
• Bootstrap: release a demo build with 40+ original seeded prompts and conspicuous “Illustrative results” badges. Instrument onboarding/plays. Before claiming a real multiplayer crowd, collect sufficient consented anonymous poll responses separately and qualify distributions; alternatively use licensed published data with faithful wording and citation. Do not claim a question has real votes if it doesn’t.
• Server should not reveal distribution until lock for scored mode; acknowledge that client-only games can be inspected and scores forged. Rate-limit anonymous submissions and version daily manifests; do not promise cheat-proof leaderboards.
• Daily resets 00:00 UTC using a deterministic date key and immutable published manifest. Display next reset in player’s local time. Daily attempts stored locally and server-side as best-effort where anonymous tokens are supported; no account means deliberate evasion remains possible.
• Persist a pseudonymous random installation ID locally, not a browser fingerprint. No unnecessary personal information. Basic disclosure for local storage and aggregate voting.

## 4. Visual system

World: 2D side/three-quarter side-view small rocket crossing a scrolling starfield; whimsical tiny planets, orbit rings, space dust, comets, softly glowing stations, varied palettes. Deep navy base with warm creams, peach-red fins, teal-blue porthole, honey-colored exhaust. Uncluttered text areas.

Character animation states: idle -> aiming -> anticipation -> ignition -> flight -> approach -> {perfect, survive, miss} -> settle/next with deterministic events. Rocket bob (~2–4 px), anticipation squash (brief), flame flutter (multi-frame), follow-through rotation, overshoot/settle, thruster sparks, near-miss panic wobble, gentle tumble on failure. Use original sprites/sheets. Avoid constant camera shake; reserve shake for launch/near-miss, muted on mobile.

Camera: parallax layers; eased follow, subtle squash/stretch on takeoff; dynamically scale view to fit safe areas; do not zoom so far that text overlaps the focal element. New visual regions at streak milestones (e.g., 5 / 15 / 30), without affecting odds.

Timing targets (tunable): idle continuous low-amplitude; button anticipation 100–150ms; ignition 150–250ms; flight 700–1300ms; reveal/settle 350–650ms. No unnecessarily long unskippable sequence; allow tap-to-skip after reveal trigger. On reduced motion show quick fade/state change and static trajectory instead.

Audio: optional original sound cues, muted by default until an explicit interaction; provide mute toggle and honor reduced motion. Don’t rely on sound for success/failure.

Accessibility: buttons accessible by keyboard, explicit labels for 0–100 input, visible focus, high contrast, live region for result, touch targets >= 44px, safe-area insets, portrait and landscape, no hover-dependent action.

## 5. Architecture and quality

• Next.js App Router + TypeScript strict + Tailwind for page and accessible DOM UI.
• PixiJS 8 for world/sprites/particles/camera. Dynamically import client-only canvas so SSR and hydration work. Use nearest filtering for sprite textures; interpolate transforms/camera smoothly; cap device pixel ratio and particle counts on mobile. WebGL baseline, graceful fallback or static DOM fallback if GPU unavailable.
• Motion for React for overlays, question cards, transitions, and buttons; keep one authoritative game state machine; do not duplicate movement timelines in React and Pixi.
• Vitest for pure state/score/selection/data logic; React Testing Library for interaction; Playwright on mobile and desktop viewports. Visual screenshots/smoke tests for key states.
• Browser local storage for anonymous progress, best, preferences; optional Supabase/Postgres/edge API in later tickets for real distributions, submission/frozen manifest. Secret keys server-only.
• All business rules pure and independent of rendering. Inject clock, random source, question repository, and result repository to make tests deterministic.
• Performance budgets: aim at near-60 FPS during typical flight on current midrange mobile; no major jank, initial image/assets small, lazy load later regions, disable costly effects for low-power devices. Measure, don’t assert success from desktop only.

## 6. Implementation process (non-negotiable)

Use Matt Pocock’s installed setup-matt-pocock-skills, to-spec, to-tickets, tdd, implement, and code-review as applicable. Preserve the scoped tickets below rather than regenerating an uncontrolled backlog. to-spec can normalize this file; to-tickets can publish these as issues with dependencies.

Every ticket: (a) write a failing test at a meaningful seam (red); (b) implement minimum passing code (green); (c) refactor; (d) execute targeted and full relevant tests, typecheck/lint; (e) manually review mobile/desktop if visual; (f) code review; (g) commit with ticket ID and evidence. Test behavior rather than animation frame timings. Screenshot/video evidence supplements, not replaces, tests. Do not merge broken work. One ticket at a time by default; vertical slices; keep app playable at checkpoints.

### Phase A — Playable prototype

#### T01 — Repository and test harness

Deps: none. Bootstrap Next.js, TS strict, Tailwind, Vitest, RTL, Playwright, CI and precommit checks; document commands.
Tests/acceptance: initial smoke Playwright test red then green; page loads mobile + desktop; lint, typecheck, test, build work.

#### T02 — Domain types and rules

Deps: T01. Create pure question/distribution/run types and explicit idle/answering/aiming/locked/flight/reveal/resolved states; invariant validation.
Tests: invalid transitions rejected; range 0–100; immutable lock; no duplicate scoring.

#### T03 — Scoring and survival

Deps: T02. Implement exact inclusive ±10 survival, distance formula, cumulative total, daily continuation and endless fatal miss.
Tests: 0, 1, 9, 10, 11, 20, 100 error; daily doesn’t end on miss; endless does; no negative distance.

#### T04 — Question seed and deterministic scheduling

Deps: T02. 40+ editorially reviewed original sample questions with versioned simulated distribution and correct labeling; deterministic Daily Five by UTC day; no repeat within endless run.
Tests: deterministic for same date/version; different date may vary; duplicates excluded; pool exhaustion explicit; excludes invalid data.

#### T05 — Basic accessible playable UI

Deps: T02–T04. One question card, YES/NO choice, 0–100 aim, lock, numeric reveal and continue; mobile and desktop with DOM controls. Minimal visuals only.
Tests: Playwright journey and keyboard flow; slider correct on both platforms; cannot lock twice; result is hidden before lock.

#### T06 — Rocket rendering vertical slice

Deps: T05. Add Pixi scene with rocket, one destination, starfield, deterministic trajectory line; scene responds to state; SSR-safe mount/unmount.
Tests: render lifecycle, state event adapter, no double renderer, basic screenshot test; app still playable if canvas fails.

#### T07 — Flight and reveal animation system

Deps: T06. Implement anticipation/ignition/flight/approach/landing or drift-out for exact/near/fail; skip/reduced-motion fallbacks.
Tests: state transitions and events across 3 outcomes, skip leaves stable final state, reduced-motion path works. Manual motion QA/video.

#### T08 — Daily Expedition end-to-end

Deps: T03–T07. Five-round game, progress, distance total, results summary, same seed for all users per day.
Tests: complete five rounds even after failures; same-day replay blocked locally; reset on UTC rollover; zero/maximum score boundaries.

#### T09 — Endless Voyage end-to-end

Deps: T03–T07. Unlimited consecutive eligible questions, lose on first >10 error, run results, restart, best streak and distance.
Tests: 10 survives, 11 ends, no advance after death, no repeats, restart resets current streak but preserves best, exhaustion state distinct from loss.

CHECKPOINT 1: Playable game with labeled simulated results and both modes. Share with a few testers; don’t yet claim genuine crowd statistics.

### Phase B — Character and polish

#### T10 — Original rocket sprites and expression states

Deps: T07. Produce cohesive original rocket sprite sheet (idle, anticipation, happy, scared, tumble), thruster frames, design tokens.
Tests: asset loading/fallback, no missing frame keys, sprite readability at smallest portrait viewport. Manual frame-by-frame art review.

#### T11 — Parallax universe and progression

Deps: T06, T09. Layered backgrounds, planet variety, drifting debris, regions at streak milestones.
Tests: seeded layouts reproducible, no content occlusion, no progression rule impact, performance smoke on mobile.

#### T12 — Cozy motion polish + audio/haptics

Deps: T07, T10, T11. Springy card transitions, micro-bob, expressive squash, engine flicker, subtle particles, original sound toggle, optional haptics only where supported and user-triggered.
Tests: mute persists, reduced-motion honored, no forced autoplay, transition durations do not delay state/score, mobile interactions responsive.

#### T13 — Mobile and desktop UX pass

Deps: T08, T09, T12. Touch drag target, desktop keyboard, portrait/landscape layouts, safe areas, pause and resume, loading/error/reduced-motion.
Tests: Playwright device matrix (e.g. narrow 360px, iPhone viewport, 768px, desktop 1440px); no overflow/tiny text, touch target sizes, focus order, reload resilience.

#### T14 — Sharing and local records

Deps: T08, T09. Shareable anonymous daily summary (distance and accuracy, with date), endless best streak, local preferences, replay affordances. Native share where available, copy fallback.
Tests: deterministic share text, no personal data, localStorage unavailable fallback, records persist, correct comparison across attempts.

CHECKPOINT 2: Visually polished portfolio-quality demo; mobile/desktop tested; usable without account.

### Phase C — Honest live results and launch readiness

#### T15 — Real poll ingestion and eligibility pipeline

Deps: T04, T08, T09. Server schema/migrations; anonymous consented vote intake or sourced distributions, editorial moderation and min-sample verification, immutable published snapshots; daily manifest publication. Keep simulated data confined to demo mode.
Tests: cannot publish under threshold; percentages derived correctly; locked version immutable; attribution exists; invalid submissions/rate limits rejected.

#### T16 — Server-backed play manifests and anti-spoiler flow

Deps: T15. Securely fetch question manifests without answer values before lock; server validates locked guess and returns official distribution version, tracks best-effort anonymous installation participation; fail safely on disconnect.
Tests: endpoints don’t leak answers pre-lock; replay/idempotency; request throttling; server recomputes scores; frozen answer remains fixed mid-run; offline interruption handled.

#### T17 — Publishable daily & endless content strategy

Deps: T15–T16. Editorial schedule for daily + sufficiently large endless pool; question retirement/quality metrics, no recent repeats, exhaustion logic; transition from prototype simulated to actual qualified scoring only when coverage is sufficient.
Tests: 7 days of manifests stable; no duplicate round in run; insufficient sample blocked; date rollover time zones; real-data badging accurate.

#### T18 — Production QA, privacy, and launch

Deps: T10–T17. Device profiling, accessibility audit, performance fixes, basic privacy/storage notice, production monitoring without invasive fingerprinting, deployment, fallback and rollback.
Tests: CI clean; E2E mobile + desktop across both modes; real answers never arrive before lock; verified sample sizes; 60fps target measured on test device, report actual; production smoke after deploy.

CHECKPOINT 3: Public launch only with qualified genuine crowd data or explicitly demo-only branding. A public release should never imply fake simulated percentages are real votes.

## 7. Explicit non-goals

Accounts, friends lists, global public leaderboards, multiplayer rooms, premium monetization, AI prompt generation, procedural physics as scoring authority, 3D, PWA install prompts, push notifications, large lore systems, and copying an existing game’s artwork.

## 8. Decision log / open risks

• Question correctness: Endlessly generated new questions are not automatically eligible; verified crowd distributions are a finite resource. Large content pool + frozen answers is the main launch constraint.
• Thematically truthful physics: The trajectory is an expressive metaphor, not a literal trajectory math simulator; percentage accuracy determines survival, never rendering variation.
• Daily-score choice: 5 * 100 = 500 ly daily maximum under the proposed rule. Playtest whether distance should scale differently or whether exact guesses should unlock cosmetic celebrations.
• One daily attempt, no accounts: Browser-local and anonymous-server best effort only; not globally cheat-proof or cross-device synchronized.
• Performance: Pixel sprites should have crisp edges while rocket/camera motion uses subpixel interpolation. Test actual phone hardware.
• Naming/IP: Offcourse is placeholder pending availability and clearance. Visual influences are thematic, not a request to imitate proprietary elements.

## 9. Codex handoff instruction

> Read `docs/OFFCOURSE_SPEC.md` (or this file) in full. Install/configure Matt Pocock skills and use `to-spec`/`to-tickets` only to formalize the 18 existing tickets with their dependency edges; do not silently change game rules. Implement T01 only. For each later ticket use `tdd` with a red-green-refactor loop at the business logic and UI behavior seams. Keep the project runnable between commits. Run targeted tests, typecheck, lint, build, and a relevant Playwright smoke check, then code-review and commit. Do not skip forward or bulk-implement all tickets. After each ticket report what works, test commands/results, screenshots where visual, and the next unlocked ticket. Ask before adding unplanned features, live data sourcing, or paid services.

### Execution authorization (user instruction accompanying this specification)

This file is the official specification. Implementation is paused until the user says start or explicitly invokes `/implement ticket [n]`. That command authorizes only the specified ticket, subject to its dependencies. After completing that ticket, report the results and wait for further instruction. Preserve the 18 ticket scopes and dependency edges above.
