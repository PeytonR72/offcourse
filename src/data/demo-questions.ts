import type { DemoCatalog } from "../domain/questions";

// Original binary propositions, reviewed against the intake checklist in
// docs/demo-content.md. Percentages are authored examples, never poll results.
const seeds: readonly (readonly [string, string, string, number])[] = [
  [
    "moon-week",
    "Would you spend a week on the Moon if the trip were free?",
    "space",
    72,
  ],
  [
    "station-window",
    "Would you choose a window seat on a space station?",
    "space",
    86,
  ],
  [
    "zero-gravity",
    "Would you try a ten-minute zero-gravity flight?",
    "space",
    67,
  ],
  [
    "name-planet",
    "Would you name a newly discovered planet after a favorite food?",
    "space",
    38,
  ],
  [
    "meteor-night",
    "Would you stay up past midnight to watch a meteor shower?",
    "space",
    61,
  ],
  ["rain-sound", "Do you enjoy the sound of rain on a roof?", "everyday", 79],
  [
    "paper-list",
    "Would you rather write a shopping list on paper than on a phone?",
    "everyday",
    43,
  ],
  [
    "early-arrival",
    "Do you prefer arriving ten minutes early for a planned meetup?",
    "everyday",
    64,
  ],
  ["matching-socks", "Do you care whether your socks match?", "everyday", 56],
  [
    "tidy-desk",
    "Do you prefer a completely clear desk when starting a project?",
    "everyday",
    58,
  ],
  ["breakfast-dinner", "Would you eat breakfast food for dinner?", "food", 83],
  [
    "crunchy-smooth",
    "Would you choose crunchy peanut butter over smooth?",
    "food",
    46,
  ],
  [
    "sweet-popcorn",
    "Would you choose sweet popcorn over salted popcorn?",
    "food",
    34,
  ],
  [
    "try-recipe",
    "Would you try a new recipe without seeing a photo of the dish?",
    "food",
    63,
  ],
  [
    "last-slice",
    "Would you ask before taking the last slice of a shared pizza?",
    "food",
    88,
  ],
  [
    "train-plane",
    "Would you choose a scenic train ride over a shorter flight for a holiday?",
    "travel",
    69,
  ],
  [
    "unplanned-day",
    "Would you leave one full day of a holiday completely unplanned?",
    "travel",
    57,
  ],
  [
    "mountain-beach",
    "Would you choose a mountain cabin over a beach cabin?",
    "travel",
    48,
  ],
  [
    "postcard",
    "Would you send a paper postcard while traveling?",
    "travel",
    37,
  ],
  [
    "map-route",
    "Would you take a longer walking route to pass through a park?",
    "travel",
    74,
  ],
  [
    "book-ending",
    "Would you ever read the last page of a novel before finishing it?",
    "stories",
    24,
  ],
  [
    "subtitles",
    "Do you prefer watching films with subtitles turned on?",
    "stories",
    53,
  ],
  [
    "reread-book",
    "Would you reread a novel you already know the ending of?",
    "stories",
    76,
  ],
  [
    "villain-story",
    "Would you watch a film told entirely from the villain's perspective?",
    "stories",
    65,
  ],
  [
    "weekly-episode",
    "Would you prefer one new episode each week over a whole season at once?",
    "stories",
    41,
  ],
  [
    "boardgame-rules",
    "Do you enjoy learning the rules of a new board game?",
    "play",
    59,
  ],
  [
    "puzzle-hint",
    "Would you use a hint after being stuck on a puzzle for twenty minutes?",
    "play",
    71,
  ],
  [
    "cooperative-game",
    "Would you choose a cooperative board game over a competitive one?",
    "play",
    54,
  ],
  [
    "game-soundtrack",
    "Would you listen to a game's soundtrack outside the game?",
    "play",
    62,
  ],
  [
    "cosmetic-reward",
    "Would you replay a game level to earn a purely cosmetic reward?",
    "play",
    45,
  ],
  [
    "cloud-shapes",
    "Do you look for recognizable shapes in clouds?",
    "nature",
    78,
  ],
  [
    "garden-herbs",
    "Would you grow kitchen herbs on a sunny windowsill?",
    "nature",
    68,
  ],
  ["snow-walk", "Would you take a walk in freshly fallen snow?", "nature", 73],
  [
    "birdsong",
    "Would you learn to recognize five local birds by their songs?",
    "nature",
    44,
  ],
  [
    "sunrise-sunset",
    "Would you choose watching a sunrise over watching a sunset?",
    "nature",
    32,
  ],
  ["learn-pottery", "Would you try a beginner pottery class?", "making", 66],
  [
    "handmade-gift",
    "Would you prefer a handmade birthday card over a store-bought one?",
    "making",
    81,
  ],
  [
    "instruction-first",
    "Do you read all the instructions before assembling a kit?",
    "making",
    52,
  ],
  [
    "keep-sketchbook",
    "Would you keep a sketchbook even if nobody else saw it?",
    "making",
    47,
  ],
  [
    "repair-mug",
    "Would you keep using a favorite mug after repairing its handle?",
    "making",
    60,
  ],
];

export const demoCatalog: DemoCatalog = Object.freeze({
  version: 1,
  label: "Illustrative results",
  entries: Object.freeze(
    seeds.map(([id, prompt, category, yesPercentage]) =>
      Object.freeze({
        question: Object.freeze({
          id: `demo-${id}`,
          prompt,
          yesLabel: "Yes",
          noLabel: "No",
          category,
          status: "published" as const,
          sourceType: "simulated" as const,
          distributionId: `demo-${id}-v1`,
        }),
        distribution: Object.freeze({
          id: `demo-${id}-v1`,
          questionId: `demo-${id}`,
          yesPercentage,
          sampleSize: 0,
          frozenAt: "2026-10-29T00:00:00Z",
          sourceAttribution:
            "Simulated for the Offcourse demo; no votes collected.",
          eligibilityStatus: "ineligible" as const,
          version: 1,
        }),
      })
    )
  ),
});
