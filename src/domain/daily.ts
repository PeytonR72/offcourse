import {
  selectDailyDemo,
  type DemoCatalog,
  type QuestionSnapshot,
} from "./questions";
import { createRun, transitionRun, type Run } from "./run";

export type DailyExpedition = Readonly<{
  dateKey: string;
  catalogVersion: number;
  questions: readonly QuestionSnapshot[];
  run: Run;
}>;

export function createDaily(catalog: DemoCatalog, at: Date): DailyExpedition {
  const selection = selectDailyDemo(catalog, at);
  if (selection.status !== "ready")
    throw new Error("Daily questions unavailable");
  return nextDaily(
    Object.freeze({
      dateKey: selection.dateKey,
      catalogVersion: selection.catalogVersion,
      questions: selection.questions,
      run: createRun(`daily:${selection.dateKey}`, "daily"),
    })
  );
}

export function nextDaily(daily: DailyExpedition): DailyExpedition {
  const entry = daily.questions[daily.run.completedRounds.length];
  if (!entry) throw new Error("Daily expedition complete");
  return Object.freeze({
    ...daily,
    run: transitionRun(daily.run, {
      type: "start_round",
      roundId: entry.question.id,
      question: entry.question,
      distributionVersion: entry.distribution.version,
    }),
  });
}
