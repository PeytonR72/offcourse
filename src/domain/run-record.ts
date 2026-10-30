import type { QuestionSnapshot } from "./questions";
import { transitionRun, type PersonalAnswer, type Run } from "./run";

export type RunRecord = {
  predictions: { answer: PersonalAnswer; percentage: number }[];
  draft: { answer: PersonalAnswer | null; percentage: number | null } | null;
};

export function recordRun(run: Run): RunRecord {
  const round = run.round;
  const locks = run.completedRounds.map(({ lock }) => lock);
  if (round.phase === "locked" || round.phase === "flight")
    locks.push(round.lock);
  if (round.phase === "reveal") locks.push(round.result.lock);
  return {
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
}

/** Rebuild scores from saved inputs; a lock interrupted by reload resolves once. */
export function restoreRun(
  run: Run,
  questions: readonly QuestionSnapshot[],
  record: RunRecord
): Run {
  if (
    !Array.isArray(record.predictions) ||
    record.predictions.length > questions.length
  )
    throw new Error("Invalid saved predictions");
  const start = (current: Run) => {
    const entry = questions[current.completedRounds.length];
    if (!entry) throw new Error("No question remaining for saved progress");
    return transitionRun(current, {
      type: "start_round",
      roundId: entry.question.id,
      question: entry.question,
      distributionVersion: entry.distribution.version,
    });
  };
  for (const prediction of record.predictions) {
    run = start(run);
    run = transitionRun(run, {
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
  }
  if (record.draft !== null) {
    run = start(run);
    if (record.draft.answer !== null) {
      run = transitionRun(run, {
        type: "choose_answer",
        answer: record.draft.answer,
      });
      if (record.draft.percentage !== null)
        run = transitionRun(run, {
          type: "aim",
          percentage: record.draft.percentage,
        });
    } else if (record.draft.percentage !== null)
      throw new Error("Invalid saved draft");
  }
  return run;
}
