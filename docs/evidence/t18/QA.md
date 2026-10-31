# T18 QA evidence — 2026-10-30 PDT / 2026-10-31 UTC

Baseline: `c8a21480ba2a0abece0b53e2c7e2f165aeb45125`. Delivery remains demo-only.
Physical-phone and screen-reader validation remain pending; this is not a
genuine-crowd launch approval or an accessibility conformance claim.

## Measured performance

Windows, AMD Ryzen 7 PRO 8840HS (8 cores/16 logical processors), integrated AMD
Radeon graphics, bundled headless Chromium 156.0.8078.4. Power/thermal conditions
were not controlled. Production Next.js build, one browser, no parallel test run
during capture. Three 2.2-second practice flights: exact, 10-point graze, 11-point
miss. Practice uses daily distance rules, so the 11-point practice round earns
45 ly; losing endless rounds still earn zero, as the gameplay tests verify.

| Profile                            | Before mean FPS range | Final mean FPS range | Final p95 gap |
| ---------------------------------- | --------------------- | -------------------- | ------------- |
| Desktop, 1280×720, 1× CPU          | 59.5–60.0             | 60.0–60.0            | 16.8 ms       |
| Pixel 7 emulation, 412×839, 4× CPU | 41.2–43.3             | 43.8–46.5            | 33.4 ms       |

Raw final capture: `profile-final.json`; baseline values retained from the first
console capture in `profile-baseline.json`. The paint fix hides SVG while the
opaque Pixi canvas is active; current SVG remains available immediately on
context loss. These single-run measurements show desktop meeting the cadence
target and a throttled profile below it. They do not establish statistical
improvement, physical-phone performance, or GPU presentation rate. No claim of
60 FPS on phones is made. Remaining device QA is in `docs/launch-readiness.md`.

## Accessibility and visuals

The initial axe audit failed WCAG label-in-name on Sound, Reduce motion and
Haptics: aria-label omitted the visible on/off text. Removing those overrides
makes the visible text the accessible name while retaining aria-pressed. All
demo aiming, paused and result states, privacy and unavailable-server screens
pass the automated WCAG 2 A/AA, 2.1 A/AA and 2.2 AA checks on desktop/mobile
Chromium. Configured qualified aiming/results are audited in the server suite.
Existing keyboard, live-result focus, reduced-motion, touch-size, landscape,
storage-error and WebGL-fallback checks remain part of the full suite.

Reviewed desktop/mobile flight screenshots show crisp rocket art, readable
results, conspicuous illustrative-results disclosure, and the new notice and
privacy link. The world screenshot baselines contained older scenery and the
removed “Demo flight” caption. Caption/region overlays are now masked in the
canvas comparison to exclude OS font rasterization; both refreshed
desktop/mobile baselines were visually inspected. The same 1% tolerance still
compares rocket, trajectory and world geometry. Pixel art and full render
lifecycle checks still pass. Privacy screenshots and final suite/deploy results
are recorded with the ticket.

## CI calibration and regression fixes

Inspection of the previous T17 GitHub run `41149676659` found existing failures:
desktop/mobile world screenshots, and the shared hosted runner's 4× throttled
cadence at p95 roughly 166–200 ms. CI now runs that responsiveness smoke at 1×
with the original p95 <100 ms and median <50 ms limits, recording the actual
throttle. Local smoke/profile captures retain 4×. CI's result is not presented as
the same 4× gate passing, nor as physical-device performance evidence.

The first full local browser run found one interaction regression: rapid Lock's
second click could hit Pause after the layout moved. Pause now ignores repeated
pointer clicks like Continue does, while single clicks and keyboard activation
still work. The existing rapid-lock test demonstrated the failure before the fix.

CI run `41152054541` passed the complete Linux browser suite, then exposed a
fixture PostgreSQL startup failure. The runner now uses loopback TCP only and
disables Unix-domain sockets, avoiding distribution-owned socket directories.
It also prints the fixture log on startup failure. PostgreSQL documents that
an empty `unix_socket_directories` value disables these sockets in its
[connection settings](https://www.postgresql.org/docs/16/runtime-config-connection.html).
This affects isolated test infrastructure only.

Run `41153142468` then exposed variable hosted frame-time failures at 1× CPU
(p95 roughly 133–167 ms) while DOM trace recording was active. The probe now
turns off tracing, writes its JSON/screenshot before budget assertions, and
retains the same p95 <100 ms / median <50 ms limits. Other CI journeys record
traces on first retry instead of tracing every successful test, following
[Playwright's guidance on tracing overhead](https://playwright.dev/docs/best-practices#debugging-on-ci).
This removes diagnostic instrumentation from timed measurements; it does not
change app rendering, physical-device gates or the recorded 4× profile.
