# Rocket art (T10)

The original Offcourse character is a small cream rocket with coral fins, a teal
porthole face, and honey exhaust. A dark silhouette and two high-contrast eyes
keep it readable at the smallest supported portrait width (320 CSS pixels).
No stock, licensed, or generated third-party character art is used.

`src/world/rocket-art.ts` is the editable source: integer pixel paths, palette
tokens, display scale, and a typed frame registry. The atlas is
`public/art/rocket-v1.svg`, a transparent 320 × 80 sheet with 64 × 40 cells.
Pixi decodes it into one image source with nearest texture filtering. Body and
engine frames share an anchor; changing expressions does not move the hull.

| Row | Frames from left to right                      |
| --- | ---------------------------------------------- |
| 0   | idle, anticipation, happy, scared, tumble      |
| 1   | thrust-0, thrust-1, thrust-2, thrust-3, unused |

Regenerate the sheet after editing the source with Node 22:

```sh
node --experimental-strip-types scripts/build-rocket-art.mjs
```

`rocketAppearance(scene)` selects presentation only. Idle/aim/flight stay neutral
until reveal; launch uses anticipation. Exact arrivals look happy; a near landing
looks scared until settlement, then relieved/happy. A miss shows dazed eyes during
the existing tumble/drift-out. Thrusters cycle through four frames from the existing
elapsed flight clock, then turn off. There is no second animation loop or new game
state, and reduced motion continues to go straight to the static final frame.
Further motion/audio work belongs to T12.

The loader checks the sheet dimensions and recovers from missing, corrupt, or
incorrectly sized images with an embedded copy from the same source. If image
decoding or WebGL fails, the SVG world draws those same paths directly. Every
frame texture is released with its renderer, including unused expressions; the
shared source is released once. No global image/texture cache outlives the scene.

The sprite suite checks expression selection, complete thruster coverage, and
offline/malformed-image recovery. It also checks that the committed atlas matches
the source. Browser tests cover loaded and missing assets, GPU failure, three
flight outcomes, reduced motion, and portrait readability with a cropped sprite
baseline. Enlarged frame review and desktop/portrait screenshots live in
`docs/evidence/t10/`. These are Chromium emulations, not measurements on a phone.
