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
- `npm test`: **186 passed** across 27 files.
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

Final measured LCP: home **1.540 s**, Daily **2.520 s**, Endless **2.480 s**;
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

The fresh final independent [visual review](visual-review.md) estimates **7.70/10
overall and 8.0/10 for Design**. It is not presented as a 10/10 result. Its final
action-order finding was addressed. The duplicate-image experiment increased
LCP, so the faster optimized image remains. Viewport tests use a fixed UTC date so the question text
does not change between test runs; all four cases pass.

Local development: `npm run dev`. Production build: `npm run build`.
The authorized main-branch push automatically deploys the illustrative demo to
<https://offcourse-five.vercel.app>.
