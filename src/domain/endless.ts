import {
  selectEndlessDemo,
  type DemoCatalog,
  type QuestionSnapshot,
} from "./questions";
import { createRun, transitionRun, type Run } from "./run";

export type EndlessVoyage = Readonly<{
  questions: readonly QuestionSnapshot[];
  run: Run;
}>;

export function createEndless(
  catalog: DemoCatalog,
  random: () => number
): EndlessVoyage {
  const questions: QuestionSnapshot[] = [];
  while (true) {
    const selection = selectEndlessDemo(
      catalog,
      questions.map(({ question }) => question.id),
      random
    );
    if (selection.status === "exhausted") break;
    questions.push(selection.entry);
  }
  const voyage = Object.freeze({
    questions: Object.freeze(questions),
    run: createRun("endless", "endless"),
  });
  return questions.length ? nextEndless(voyage) : voyage;
}

export function endlessProgress(voyage: EndlessVoyage) {
  const { run, questions } = voyage;
  return {
    status:
      run.status === "lost"
        ? ("lost" as const)
        : run.completedRounds.length === questions.length
          ? ("exhausted" as const)
          : ("active" as const),
    streak: run.completedRounds.filter(({ score }) => score.survived).length,
    distance: run.totalDistance,
  };
}

export function nextEndless(voyage: EndlessVoyage): EndlessVoyage {
  if (endlessProgress(voyage).status !== "active")
    throw new Error("Voyage has ended");
  const entry = voyage.questions[voyage.run.completedRounds.length];
  return Object.freeze({
    ...voyage,
    run: transitionRun(voyage.run, {
      type: "start_round",
      roundId: entry.question.id,
      question: entry.question,
      distributionVersion: entry.distribution.version,
    }),
  });
}
