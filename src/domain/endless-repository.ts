import { createEndless, endlessProgress, type EndlessVoyage } from "./endless";
import type { DemoCatalog, QuestionSnapshot } from "./questions";
import { createRun } from "./run";
import { recordRun, restoreRun, type RunRecord } from "./run-record";

type Best = Readonly<{ streak: number; distance: number }>;
type VoyageRecord = RunRecord & {
  schemaVersion: 1;
  questions: readonly QuestionSnapshot[];
  best: Best;
};
const key = "offcourse:endless:v1";

function encode(voyage: EndlessVoyage, best: Best): string {
  const record: VoyageRecord = {
    schemaVersion: 1,
    questions: voyage.questions,
    best,
    ...recordRun(voyage.run),
  };
  return JSON.stringify(record);
}

function decode(raw: string): { voyage: EndlessVoyage; best: Best } {
  // Replay validated inputs against frozen questions; never trust stored scores.
  const record: VoyageRecord = JSON.parse(raw);
  if (
    record.schemaVersion !== 1 ||
    !Array.isArray(record.questions) ||
    !Array.isArray(record.predictions) ||
    record.predictions.length > record.questions.length ||
    !record.best ||
    !Number.isSafeInteger(record.best.streak) ||
    record.best.streak < 0 ||
    !Number.isSafeInteger(record.best.distance) ||
    record.best.distance < 0
  )
    throw new Error("Invalid voyage record");
  const validated = createEndless(
    { version: 1, label: "Illustrative results", entries: record.questions },
    () => 0
  );
  if (validated.questions.length !== record.questions.length)
    throw new Error("Invalid frozen voyage questions");
  const questions = Object.freeze(
    record.questions.map(({ question }) =>
      validated.questions.find((entry) => entry.question.id === question.id)!
    )
  );
  const voyage: EndlessVoyage = Object.freeze({
    questions,
    run: restoreRun(createRun("endless", "endless"), questions, record),
  });
  if (voyage.run.round.phase === "idle" && questions.length)
    throw new Error("Invalid voyage progress");
  return { voyage, best: record.best };
}

/** Saves the attempt and its browser bests together, rejecting stale-tab writes. */
export function createEndlessRepository(
  storage: Pick<Storage, "getItem" | "setItem">,
  catalog: DemoCatalog,
  random: () => number
) {
  let previous: string | null = null;
  let loaded = false;
  let best: Best = { streak: 0, distance: 0 };
  const save = (voyage: EndlessVoyage): Best => {
    if (!loaded || storage.getItem(key) !== previous)
      throw new Error(
        "Voyage changed in another tab. Reload to resume safely."
      );
    const progress = endlessProgress(voyage);
    const nextBest = {
      streak: Math.max(best.streak, progress.streak),
      distance: Math.max(best.distance, progress.distance),
    };
    const encoded = encode(voyage, nextBest);
    if (encoded !== previous) storage.setItem(key, encoded);
    previous = encoded;
    best = nextBest;
    return best;
  };
  return {
    load() {
      previous = storage.getItem(key);
      const restored =
        previous === null
          ? { voyage: createEndless(catalog, random), best }
          : decode(previous);
      best = restored.best;
      loaded = true;
      return { voyage: restored.voyage, best: save(restored.voyage) };
    },
    save,
  };
}
