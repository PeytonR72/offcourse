# Offcourse: a little rocket, a lot of humanity

The current direction is **Second polish pass: the observatory**, below. The
earlier sections record the first redesign; the second pass supersedes its
palette, dimensions, static hero, and flight-console composition.

## Brief and scope

User-authorized visual revamp, 2026-10-31, following completed T01–T18.
Make the existing playable demo feel like a finished indie browser game, using
krillion.io as inspiration for atmosphere, pixel typography and direct play entry.
Keep original artwork, existing game rules, local records and explicit simulated
data disclosures. No live-data release, accounts, new game modes or paid services.
Existing Next.js/TypeScript/Tailwind, Motion and Pixi stack is retained. The
project's authoritative motion/state architecture takes priority over adding a
second GSAP/Lenis animation clock. Native scrolling is intentional for gameplay.

## Concepts considered

| Territory | Concept / signature                                                                | Emotion / screenshot                                       | Anchor                                    | Originality / fit / feasibility / portability |
| --------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| Name      | A wandering route joins distant worlds; the rocket follows the player's prediction | Curious; a tiny warm rocket in a vast orbital chart        | Offcourse and percentage-based navigation | 4 / 5 / 5 / 2                                 |
| Material  | A spacecraft instrument panel uses gauges for every choice                         | Precise; a cockpit full of readable prediction instruments | The 0–100 aim control                     | 3 / 4 / 5 / 3                                 |
| Process   | A travel journal collects each arrival as a postage stamp                          | Cozy; five expedition stamps                               | Daily's five destinations                 | 4 / 4 / 4 / 2                                 |

Choose the wandering route: it makes the rocket central and carries from the
landing illustration into the existing trajectory, daily progress and lost-route 404.

## Concept card

Idea: Humanity is your navigation system. Every prediction takes a little rocket somewhere new.
Metaphor: An illustrated star atlas with a friendly flight console.
Signature: A dotted orbital route and original pixel rocket invite a launch; the
same rocket and percentage trajectory become interactive in play.
Emotion: Quiet wonder, then the urge to try one flight.
Motion verb: Drift, then settle.
Screenshot: Oversized pixel Offcourse wordmark, a cream-and-coral rocket suspended
between teal and ochre worlds, and two immediately readable play choices.

## System

- Ground / deep space: #091321. Panel / night: #111f30.
- Ink / starlight: #f8efd9. Muted / blue dust: #a9bdcf.
- Line / orbit: #2e4359. Accent / ignition: #f5c879.
- Secondary illustration colors come from the existing original rocket: coral and teal.
- Display: Silkscreen 400, Google Fonts, self-hosted WOFF2. Pixel voice for the
  wordmark and major numerals. Text/UI: DM Sans 400–700, self-hosted WOFF2.
- Desktop 12-column grid, 32px gutters, maximum 1200px; gameplay maximum 760px.
  Mobile 4 columns, 20px gutters, single-column mode selection and compact art.
- Shape: 16px panels, 10px controls, circular orbit markers. No glass panels.
- Motion: existing Motion/Pixi game engine. New decorative hero stays still at
  rest intentionally: a quiet star atlas, with physical button lift and arrow
  travel. Gameplay owns the living rocket and state-driven flight choreography.
- All controls: visible focus, 44px minimum targets, hover lift/fill, press settle.
- Reduced motion keeps the full illustration and static, readable game states.

## Composition

Home, poster + illustrated atlas:

    [brand]           [Daily | Endless | How to play]       [preferences]
                    [A little rocket. A lot of humanity.]
                              OFFCOURSE
                    [one clear sentence about play]
       (ochre planet) ---- tiny rocket ---- (ringed teal planet)
                  [Daily Expedition] [Endless Voyage]
                       [honest demo disclosure]

How to play, horizontal flight sequence (stacked on mobile):

    [Your intuition is the fuel.]  01 Answer -> 02 Predict -> 03 Launch

Practice, asymmetric pair (stacked on mobile):

    [A test flight,                  [live world]
     before the expedition.]        [question, answers, aim, launch]
    [rules + no-score disclosure]

Inner game pages, flight console:

    [return]                       [mode label]
    [mode name + brief rules]
    [disclosure] [distance/progress instruments]
    [world + question/aim/result control panel]

Footer: compact brand sign-off, local-storage information and privacy link.
404: lost orbital waypoint, a plain recovery link to the launchpad.

## Genericness check

Reject marketing feature-card grids, fake player counts, testimonials and a
gradient-blob hero. Two mode panels express actual choices; the original rocket
and planets carry the atmosphere. Instructions teach the actual YES-axis and
inclusive ten-point survival rule. The homepage remains playable below its entry.

## Validation plan

Use the existing authorized public page/control seams for navigation and keyboard
regressions. Run unit tests, typecheck, lint, build and existing full browser
journeys. Two production visual passes with fresh independent critics, desktop,
phone, reduced-motion, hover/focus and automated accessibility evidence.

No fictional credentials or content placeholders. The deliberate demo uses
simulated distributions until a separately authorized real-content release.

## Refinements from review

- Compact the opening composition so both launch actions fit a 900px desktop view.
- Keep introductory information brief in game routes. Put next-reset and local
  record details below the console, with the simulated-results notice above play.
- Reserve space only during saved-game loading to prevent footer displacement.
- Let mission link names come from their visible content, including launch labels.
- Apply both system and in-app reduced motion to CSS feedback and route arrivals.
- Route arrivals drift 14px into place in 240ms through the existing Motion stack;
  preferences and navigation persist. No blocking loader or exit delay.
- Final accessory removed: the decorative sentence below the orbital illustration.
- Disabled lock buttons intentionally do not react to hover; automated hover tools
  list them as unchanged. Enabled controls and launch cards have physical feedback.
- Final mobile console puts the world, aim, and launch within one phone viewport;
  keyboard help lives in a native expandable section below the main action.
- Earned distance is the dominant result, followed by the prediction/actual pair.
- Reserve haptics capability space and contain loading margins to avoid hydration
  layout shifts. Unsupported haptics remain hidden and disabled.

## Second polish pass: the observatory (2026-10-31)

The user explicitly authorized further redesign after the first pass. This is a
T18 visual refinement, preserving all rules, scope, and honest demo disclosures.

Three directions were considered anew:

| Territory | Direction and signature                                                                                                | Emotion / screenshot                                                         | Anchor                                               | Originality / fit / feasibility / portability |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| Place     | A moon observatory launches a tiny ship into other people's opinions. A living rocket sits above two mission controls. | Quiet wonder; cream pixel lettering between immense apricot and mint planets | Offcourse's rocket and human intuition as navigation | 4 / 5 / 5 / 2                                 |
| Material  | A brass-and-enamel analog mission desk with physical prediction dials                                                  | Tactile curiosity; instrument closeup                                        | Integer percentage aiming                            | 4 / 4 / 3 / 3                                 |
| Formal    | An infinite route becomes the interface, connecting questions and destinations                                         | Discovery; a single unfolding route                                          | Endless survival streak                              | 4 / 4 / 3 / 2                                 |

Choose the observatory: the existing rocket belongs in a richer world, and the
same scenery can connect the title screen, actual flight, and recovery state.

Idea: Your intuition is the navigation system of a tiny ship in an enormous cosmos.
Metaphor: A cozy observatory and its flight computer.
Signature: The familiar expressive rocket drifts above the mission controls, then
becomes the pilot's own live trajectory inside a compact flight station.
Emotion: Wonder, warmth, and an immediate invitation to play.
Motion verb: Drift, then settle; existing Motion and Pixi clocks only.
Screenshot: An ivory pixel wordmark between huge peach and mint planets, with a
small warm rocket and two distinct mission controls.

Palette: ground #091321; instrument #142235; ink #fff1d6; muted #acbdce;
ignition #ffcf8b; destination #a6dfcf. Retain self-hosted Silkscreen and DM Sans.
Controls use 6px radii; major surfaces 12px; circular instrument accents only.
Desktop mission selection is 800px wide, the cockpit 1104px with two columns.
Phone has a compact vertical station, 44px controls, and a separate scenic crop.

    title screen: [navigation + preferences]
                   [invitation / OFFCOURSE / explanation]
        moon       [rocket and dotted route]        ringed planet
                   [daily mission] [endless mission]
                   [illustrative results / help]
    flight station: [mission / disclosure / run instruments]
                    [world + heading | question + answer + aim + launch]
    phone:          [world]
                    [question / answer / aim / launch]

The generated observatory art is original, made with the built-in image-generation
tool, encoded as WebP at public/art/observatory.webp (127,460 bytes). It contains no
text, UI, or rocket; live DOM type and the existing rocket stay independently
readable. The final prompt is preserved in public/art/README.md.

Genericness correction: replace the isolated vector planets with an authored
world; use real navigation instruments rather than feature cards. No artificial
metrics, badges, scores, or players. The desktop cockpit solves the old long-form
scroll problem. The same honest simulated-data notice is visible before play.
The hero drift pauses offscreen and responds to the existing reduced-motion
preference. Navigation stays native and instantaneous; no loading theatre.

Final refinement: complete expeditions use a scenic stage, a dominant earned
score, and a compact flight log. Daily emphasizes distance; Endless emphasizes
streak and longest streak. Share text is a native disclosure that opens
automatically if manual copying is needed. Game routes preload the scenery from
their server-rendered introduction. The redundant caption beneath the title-screen
rocket was the final decorative cut.
