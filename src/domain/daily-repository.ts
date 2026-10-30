import { createDaily, type DailyExpedition } from "./daily";
import { selectDailyDemo, type DemoCatalog } from "./questions";
import { createRun } from "./run";
import { recordRun, restoreRun, type RunRecord } from "./run-record";

type DailyRecord = Omit<DailyExpedition, "run"> &
  RunRecord & {
    schemaVersion: 1;
  };

function encode(daily: DailyExpedition): string {
  const record: DailyRecord = {
    schemaVersion: 1,
    dateKey: daily.dateKey,
    catalogVersion: daily.catalogVersion,
    questions: daily.questions,
    ...recordRun(daily.run),
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
  const daily: DailyExpedition = Object.freeze({
    dateKey: record.dateKey,
    catalogVersion: record.catalogVersion,
    questions,
    run: restoreRun(
      createRun(`daily:${record.dateKey}`, "daily"),
      questions,
      record
    ),
  });
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
