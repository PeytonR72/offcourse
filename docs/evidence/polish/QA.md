# Observatory polish

User-authorized second visual redesign, following completed T18. Review baseline:
`5d2d593`. The existing Next.js, Motion and Pixi architecture remains in place.

## Delivered

- Original pixel-art observatory scenery, a larger title-screen composition,
  refined mission cards and an independently animated original rocket.
- A shared flight computer with live heading instruments and a two-column
  desktop cockpit. Narrow phones keep the world, aim and launch together.
- Clear disabled-launch guidance, visible labels that match accessible names,
  and effective reduced motion that also stops the offscreen hero loop.
- Composed completion screens: distance leads Daily; streak and longest streak
  lead Endless. Flight logs remain detailed, while raw share text is optional.
  Failed clipboard access opens and selects the manual-copy field.
- Secondary storage explanations are expandable. The simulated-data disclosure
  stays visible. Scoring, question selection, persistence and backend rules are
  unchanged. No real-data release or external service was added.

Artwork provenance and the final prompt are in [the art readme](../../../public/art/README.md).
The final decorative cut removes the redundant caption beneath the hero rocket.

## Verification

- Meaningful red: the new opening-view test initially found the desktop launch
  button completely outside the viewport. The corrected cockpit passes at desktop,
  normal phone and 360×800 narrow-phone dimensions.
- `npm test`: **187 passed** across 28 files after the endpoint refinement.
- `npm run lint`, `npm run typecheck`, `npm run build`: pass.
- Full browser journeys: **92 passed, 16 expected skips**. The skips are ten
  separately configured backend cases and six duplicate/device-specific cases.
- Isolated flight-cadence checks: **2 passed** with the existing timing budgets.
- Completion, navigation, accessibility and narrow-phone regression after the last
  layout refinement: **30 passed**.
- Intentional world/rocket screenshot updates were visually inspected. Landscape
  has actual Windows and Linux captures; the Linux screenshot assertion passed
  under Ubuntu Chromium with CSS-pixel scale. No threshold was relaxed.
- Full production visual crawl: no console errors, overflow, undersized targets,
  invisible keyboard focus, hidden reduced-motion text, or axe violations on
  home, Daily, Endless, privacy and the designed 404.
- Static audit: **0 FAIL / 0 WARN**; about **402 KB** estimated heaviest route,
  including **239 KB gzipped JavaScript**. These are local emulated measurements,
  not a physical-device or screen-reader certification.

## Standards

Independent review found the decorative rocket continuing its repeat loop after
reduced motion, and a visible slider label absent from its accessible name. Both
are corrected and verified. Final review: **no actionable findings**. Native share
cancellation, copy fallback, focus management and result announcements remain.

## Spec

Independent review caught the narrow-phone launch fold and a distance-first
Endless completion hierarchy. Both are corrected: the 360×800 launch spans
y=744–791; Endless emphasizes streak and shows distance secondarily. Final
review: **no actionable findings**.

## Visual iteration

Two independent intermediate critics identified weak mobile framing, excessive
game-page height, a late scenery request, and a report-like completion screen.
Those findings drove the mobile crop, compact cockpit, server-rendered image
preload, and completion layout. Intermediate weighted scores were 7.12 and 7.35;
these are estimates, not awards. Final evidence and assessment accompany this file.

The pre-preload full crawl is retained in `visual-audit-before-preload.json`.
It measured game-route LCP near four seconds. Final measurements preserve the same
4× CPU and 1.6 Mbps / 150 ms network settings and are recorded separately.

Before the navigation handoff, measured LCP was home **1.540 s**, Daily **2.520 s**, Endless **2.480 s**;
CLS **0** on all three. Daily is 20 ms above the aspirational 2.5 s threshold;
the result is reported without rounding it into a pass. The flight-specific art
is 48,332 bytes, down from the 127,460-byte full-size background. The final browser
report also records actual metadata/status responses, the slider's accessible
name, and enabled launch hover properties.

Final visual regression: **9 passed / 1 expected duplicate-device skip**;
the independent Linux landscape assertion also passed.

Screenshots: [desktop home](home-desktop.png), [phone home](home-mobile.png),
[flight station](daily-desktop.png), [phone flight](daily-mobile.png),
[daily completion](daily-complete-desktop.png),
[phone completion](daily-complete-mobile.png), and
[Endless result](endless-result-desktop.png).

The intermediate independent review estimated **7.70/10
overall and 8.0/10 for Design**. It was not presented as a 10/10 result. Its
action-order finding was addressed. The duplicate-image experiment increased
LCP, so the faster optimized image remains. Viewport tests use a fixed UTC date so the question text
does not change between test runs; all four cases pass.

Local development: `npm run dev`. Production build: `npm run build`.
The authorized main-branch push automatically deploys the illustrative demo to
<https://offcourse-five.vercel.app>.

## Final endpoint refinement

The result now names the predicted and actual endpoints directly in the scene,
with a single badge for exact matches. Text keeps a fixed readable size on phones;
close guesses separate their labels vertically. The caption explains the error's
size and direction, and the desktop instrument displays the actual percentage.
No values appear before the existing reveal boundary.

The new browser assertion first failed because the annotations did not exist.
After implementation, **28 flight/renderer checks pass** on desktop and phone,
including guesses of 0, 44, 45, 75 and 100, bounds, non-overlap, reveal timing,
reduced motion and GPU fallback. Bounds are read in one layout frame to avoid
comparing different positions during result-focus scrolling; the containment
assertions were not relaxed. Build, lint and typecheck pass.

Both independent code reviewers caught rounding that could mislabel 63% against
a 62.5% actual result as perfect. The fix uses the authoritative actual percentage
and score error, with a passing unit regression. Both final reviews report **no
remaining actionable findings**.

Retained examples: [close guess on phone](annotated-close-mobile.png),
[miss on phone](annotated-miss-mobile.png), and
[perfect match on desktop](annotated-perfect-desktop.png).

The preceding deployment at `6b746e2` passed all 14 live smoke checks and
[hosted CI](https://github.com/PeytonR72/offcourse/actions/runs/41275866131),
including the isolated PostgreSQL suite. Delivery verification for this final
refinement is reported separately after its push.

## Navigation and phone result handoff

A further review estimated 7.73 overall and identified route continuity, the
mobile result fold and reward explanation as the highest-value remaining changes.
The final pass connects the chosen mission title to its game heading using the
installed React/Next ViewTransition APIs, with no dependency or configuration
change. Native navigation remains usable when the API is missing. Both reduced-
motion preferences disable the animation.

Mobile results now use a compact horizontal reward, a nearby scoring explanation,
and paired secondary metrics. The new 360×800 test first failed with Continue
entirely below the viewport; it now passes with the full button visible.
All **18 layout/navigation checks pass**, covering normal transitions, system
and in-app reduced motion, unsupported browsers, back navigation and accessibility.
The native transition's actual animation keyframes and durations are retained in
`navigation-motion.json`; transition PNGs freeze those animations at 100/220 ms.
Both code-review axes report no remaining actionable findings for these changes.

The final fresh [visual review](visual-review.md) estimates **7.73/10**. Its
transition-overlap finding prompted a faster outgoing fade and a 110ms delay
before incoming content appears. Result captions retain a 12px minimum. Reduced
motion explicitly removes the round-card transform, preventing fractional
44px target measurements while keeping the original size assertions intact.

One full unit run hit the existing Endless test's one-second async focus watchdog
under concurrent browser work; the isolated test passed. Its watchdog now allows
three seconds, consistent with the Daily test, while retaining the same focus
assertion. No animation timing or performance budget was relaxed.

The final repeat with the same throttle settings measured home **1.512 s**,
Daily **2.436 s**, Endless **2.316 s**, with **zero CLS** and no overflow.
`final-browser-report.json` records that run; `browser-report-before-handoff.json`
preserves the earlier values used by the independent critic. This is a local
emulated run, not proof of identical performance on every physical phone.

The expanded browser suite completed **111 passes / 16 expected skips** and
identified the fractional target-size issue described above. After correction,
all **11 focused layout/navigation/device cases pass**, with one expected
duplicate-device skip. Final hosted CI runs the entire suite again.
