import { createDaily, nextDaily, type DailyExpedition } from "./daily";
import { selectDailyDemo, type DemoCatalog } from "./questions";
import { createRun, transitionRun, type PersonalAnswer } from "./run";

type DailyRecord = Omit<DailyExpedition, "run"> & {
  schemaVersion: 1;
  predictions: { answer: PersonalAnswer; percentage: number }[];
  draft: { answer: PersonalAnswer | null; percentage: number | null } | null;
};

function encode(daily: DailyExpedition): string {
  const round = daily.run.round;
  const locks = daily.run.completedRounds.map(({ lock }) => lock);
  if (round.phase === "locked" || round.phase === "flight")
    locks.push(round.lock);
  if (round.phase === "reveal") locks.push(round.result.lock);
  const record: DailyRecord = {
    schemaVersion: 1,
    dateKey: daily.dateKey,
    catalogVersion: daily.catalogVersion,
    questions: daily.questions,
    predictions: locks.map(({ answer, guessPercentage }) => ({
      answer,
      percentage: guessPercentage,
    })),
    draft:
      round.phase === "answering"
        ? { answer: null, percentage: null }
        : round.phase === "aiming"
          ? { answer: round.answer, percentage: round.guessPercentage }
          : null,
  };
  return JSON.stringify(record);
}

function decode(raw: string, at: Date): DailyExpedition {
  // All stored fields used below are validated; scores are reconstructed, never trusted.
  const record: DailyRecord = JSON.parse(raw);
  if (
    record.schemaVersion !== 1 ||
    record.dateKey !== at.toISOString().slice(0, 10) ||
    !Array.isArray(record.questions) ||
    record.questions.length !== 5 ||
    !Array.isArray(record.predictions) ||
    record.predictions.length > 5
  )
    throw new Error("Invalid daily record");
  const selection = selectDailyDemo(
    {
      version: record.catalogVersion,
      label: "Illustrative results",
      entries: record.questions,
    },
    at
  );
  if (selection.status !== "ready")
    throw new Error("Invalid frozen daily questions");
  const questions = Object.freeze(
    record.questions.map(({ question }) =>
      selection.questions.find((entry) => entry.question.id === question.id)!
    )
  );
  let daily: DailyExpedition = Object.freeze({
    dateKey: record.dateKey,
    catalogVersion: record.catalogVersion,
    questions,
    run: createRun(`daily:${record.dateKey}`, "daily"),
  });
  for (const prediction of record.predictions) {
    daily = nextDaily(daily);
    let run = transitionRun(daily.run, {
      type: "choose_answer",
      answer: prediction.answer,
    });
    run = transitionRun(run, {
      type: "aim",
      percentage: prediction.percentage,
    });
    run = transitionRun(run, { type: "lock" });
    run = transitionRun(run, { type: "launch" });
    run = transitionRun(run, {
      type: "reveal",
      distribution: questions[run.completedRounds.length].distribution,
    });
    run = transitionRun(run, { type: "resolve" });
    daily = Object.freeze({ ...daily, run });
  }
  if (record.draft !== null) {
    daily = nextDaily(daily);
    if (record.draft.answer !== null) {
      let run = transitionRun(daily.run, {
        type: "choose_answer",
        answer: record.draft.answer,
      });
      if (record.draft.percentage !== null)
        run = transitionRun(run, {
          type: "aim",
          percentage: record.draft.percentage,
        });
      daily = Object.freeze({ ...daily, run });
    } else if (record.draft.percentage !== null)
      throw new Error("Invalid daily draft");
  }
  if (daily.run.round.phase === "idle")
    throw new Error("Invalid daily progress");
  return daily;
}

/** One dated attempt, with injected storage/clock and stale-tab write protection. */
export function createDailyRepository(
  storage: Pick<Storage, "getItem" | "setItem">,
  catalog: DemoCatalog,
  clock: () => Date
) {
  let key: string | undefined;
  let previous: string | null = null;
  return {
    load(): DailyExpedition {
      const at = clock();
      key = `offcourse:daily:v1:${at.toISOString().slice(0, 10)}`;
      previous = storage.getItem(key);
      const daily =
        previous === null ? createDaily(catalog, at) : decode(previous, at);
      const encoded = encode(daily);
      storage.setItem(key, encoded);
      previous = encoded;
      return daily;
    },
    save(daily: DailyExpedition): void {
      if (!key || daily.dateKey !== clock().toISOString().slice(0, 10))
        throw new Error("Daily date changed. Reload for the new expedition.");
      if (storage.getItem(key) !== previous)
        throw new Error(
          "Daily progress changed in another tab. Reload to resume."
        );
      const encoded = encode(daily);
      if (encoded !== previous) storage.setItem(key, encoded);
      previous = encoded;
    },
  };
}
