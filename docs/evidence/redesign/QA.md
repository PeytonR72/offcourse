# Offcourse visual revamp

Authorized by the user's 2026-10-31 request to use the awwwards skill and
krillion.io as a style reference. This is a visual follow-up to completed
T01–T18, not a new live-data launch. Review baseline: `5396e1f`.

## Delivered

- Original orbital illustration, pixel wordmark, locally hosted Silkscreen and
  DM Sans, and a consistent navy/ivory/amber visual system.
- Daily and Endless entry cards, a concise instructional sequence, and an
  immediately playable practice console on the homepage.
- Shared answer controls, percentage aiming, result panels, progress instruments,
  page navigation, settings, footer, error recovery and designed 404.
- Accessible skip link, current-route navigation, 44px interaction targets,
  keyboard play, and both system and in-app reduced-motion support.
- Per-route metadata, generated social preview, favicon, canonical URLs, sitemap,
  robots rules and VideoGame structured data.
- Original game rules, anonymous records, privacy disclosures, source eligibility,
  and demo-only branding preserved. No accounts, paid services or real polls added.

## Validation

- Meaningful red: the homepage did not expose the requested mode-entry links and
  instructions. Green: navigation test passes after the redesign.
- `npm run test`: **186 tests passed / 27 files**.
- `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`: pass.
- `node node_modules/@playwright/test/cli.js test --update-snapshots`:
  **88 passed / 16 expected skips**. Skips are ten separately configured backend
  checks and six duplicate or device-specific cases. No backend code was changed.
- Browser journeys cover daily 0/500 score boundaries, all forty endless questions,
  inclusive 10-point survival and 11-point loss, reload and duplicate lock safety,
  sound/haptics, reduced motion, keyboard/touch, storage failure, GPU loss,
  accessibility, privacy and designed 404 recovery.
- Four visual baselines changed with the narrower practice console and new font:
  desktop rocket crop, desktop/mobile world viewport, and landscape viewport.
  Each was inspected before accepting the update; source rocket art is unchanged.
- The Windows test-server command now invokes Next directly so the port argument
  is preserved consistently across shells.

## Independent review

Two code reviewers independently checked Standards and Spec. Their common
finding, in-app reduced motion not reaching CSS, is fixed through the effective
preference on a shared ancestor. A later loading-selector finding is fixed with
an explicit loading class so blocked-storage notices do not reserve blank space.

The first visual critic scored the evidence **7.3/10** and identified accessible
names, gameplay entry density, missing visible spaces, and layout shift. All
were addressed before the second production capture. Raw captures and both
critic reports are retained locally in `.scratch/design/`.

The disabled Lock prediction button intentionally does not react to hover.
The star-atlas landing illustration intentionally remains still at rest; the
actual game owns the breathing rocket and state-driven flight animation.

## Scope limits

This remains an explicitly labeled illustrative demo. Genuine-crowd release
still requires qualified poll content and separate release approval. Browser
performance measurements use Chromium emulation, not a physical phone.

## Final interaction refinements

The second independent critic scored the completed second pass 7.63/10. Its
highest-value suggestions were implemented: tighter mobile spacing keeps the
flight view and launch controls together, keyboard instructions use a native
expandable section, distance is the dominant result, and distance units do not
wrap apart. A LayoutShift observer identified late haptics insertion and child
margin collapse; reserving the control footprint and containing margins removed
those shifts (targeted diagnostic: zero entries).

Final interaction evidence includes keyboard-only aiming and launch, enabled
Lock hover, distance result screens, the rendered social image and actual
metadata/status responses. The existing Next.js/Motion/Pixi stack is retained;
no new motion runtime or scrolling interception was introduced.

Final verification after the interaction refinements:

- Focused browser regression: **32 passed / 6 device-specific skips**.
- Additional preferences, accessibility and navigation pass: **38 passed / 6 skips**.
- Final daily throttled capture: LCP **956 ms**, CLS **0**, scroll **60 fps**.
  No console errors, horizontal overflow, small targets, hidden reduced-motion
  text, invisible focus stops, or axe violations. This is an emulated measurement.
- Social preview responds with HTTP 200 and image/png; recovery responds 404.
  Saved `metadata.json` contains actual canonical, description, social tags and
  structured-data responses. Final site audit is captured separately.

Screenshots: [desktop home](desktop-home.png), [mobile home](mobile-home.png),
[keyboard aiming](mobile-keyboard-aim.png), [mobile result](mobile-result.png),
[desktop result](desktop-result.png).

- Final home throttled capture: LCP **1200 ms**, CLS **0**, scroll **60 fps**.
- Final audit: **0 FAIL / 0 WARN**; estimated heaviest route **299 KB**
  (232 KB compressed JS, 9 KB compressed CSS, 44 KB fonts, 14 KB HTML).

Final independent visual review: **7.64/10**, with no blocking defect established.
This does not meet the skill's aspirational 8/10 across every category, and is
not presented as an Awwwards result. The remaining refinements are initial game
page spacing, parallel result labels, a more illustrated social preview, and
route-specific social tags. The complete evidence-based review is retained in
`visual-review.md`; none of these is a gameplay or automated accessibility blocker.

Local development: `npm run dev`. Production build: `npm run build`.
The existing GitHub main-branch push deploys the illustrative demo to Vercel.
Content lives in `src/data/site.ts`; no fictional credentials or stock-image
placeholders need replacement. Simulated poll percentages remain deliberate.

## Deployment verification

Commit `2aab9ae` deployed through the existing main-branch integration to
https://offcourse-five.vercel.app. Vercel reported READY with that exact SHA and
stable alias. The initial live smoke caught a test selector racing navigation:
its generic heading matched the homepage's Endless card before the destination
loaded. The test now waits for the destination h1 and reads `#question`; the
independent standards reviewer confirmed the fix. This changed no application
behavior. The production suite was rerun against the deployed demo.

Live production smoke: **14 passed** on desktop and mobile.
