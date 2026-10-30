"use client";

import { useCallback, useState } from "react";
import { demoCatalog } from "../data/demo-questions";
import { selectEndlessDemo } from "../domain/questions";
import { createRun, transitionRun, type Run } from "../domain/run";
import { RoundPlayer, type Playback } from "./round-player";

function nextQuestion(run: Run) {
  return selectEndlessDemo(
    demoCatalog,
    run.completedRounds.map(({ lock }) => lock.question.id),
    () => 0
  );
}

function startNext(run: Run): Run {
  const selection = nextQuestion(run);
  if (selection.status === "exhausted") return run;
  return transitionRun(run, {
    type: "start_round",
    roundId: selection.entry.question.id,
    question: selection.entry.question,
    distributionVersion: selection.entry.distribution.version,
  });
}

export function Practice() {
  const [playback, setPlayback] = useState<Playback>(() => ({
    run: startNext(createRun("practice", "daily")),
  }));
  const update = useCallback(
    (change: (current: Playback) => Playback) => setPlayback(change),
    []
  );
  return (
    <RoundPlayer
      playback={playback}
      update={update}
      questions={demoCatalog.entries}
      label="Practice flight"
      completionText="Practice complete — you’ve explored every demo question."
      onContinue={
        nextQuestion(playback.run).status === "exhausted"
          ? undefined
          : () =>
              update((current) =>
                current.run.round.phase === "resolved"
                  ? { run: startNext(current.run) }
                  : current
              )
      }
    />
  );
}
