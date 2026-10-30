"use client";

import { useEffect, useRef, useState } from "react";
import { demoCatalog } from "../data/demo-questions";
import { selectEndlessDemo } from "../domain/questions";
import {
  createRun,
  transitionRun,
  type PersonalAnswer,
  type Run,
} from "../domain/run";
import { RocketWorld } from "../world/rocket-world";
import { advanceFlight, flightTiming } from "../world/flight";

type Playback = { run: Run; elapsed?: number };

function updateFlight(
  current: Playback,
  elapsed: number,
  action?: "skip" | "reduced"
): Playback {
  const round = current.run.round;
  if (
    round.phase !== "locked" &&
    round.phase !== "flight" &&
    round.phase !== "reveal"
  )
    return current;
  const lock = "lock" in round ? round.lock : round.result.lock;
  const entry = demoCatalog.entries.find(
    ({ distribution }) => distribution.id === lock.question.distributionId
  )!;
  return {
    run: advanceFlight(current.run, entry.distribution, elapsed, action),
    elapsed,
  };
}

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
  // Practice uses the continuing scoring rule; this is not a ranked daily attempt.
  const [{ run, elapsed }, setPlayback] = useState<Playback>(() => ({
    run: startNext(createRun("practice", "daily")),
  }));
  const setRun = (update: (current: Run) => Run) =>
    setPlayback((current) => ({ run: update(current.run) }));
  const heading = useRef<HTMLHeadingElement>(null);
  const round = run.round;
  const flying =
    round.phase === "locked" ||
    round.phase === "flight" ||
    round.phase === "reveal";
  useEffect(() => {
    if (!flying) return;
    const started = performance.now();
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const tick = () => {
      const elapsed = performance.now() - started;
      setPlayback((current) =>
        updateFlight(current, elapsed, media?.matches ? "reduced" : undefined)
      );
      if (elapsed < flightTiming.settled && !media?.matches)
        frame = requestAnimationFrame(tick);
    };
    const changed = () => {
      if (media?.matches) {
        cancelAnimationFrame(frame);
        tick();
      }
    };
    media?.addEventListener("change", changed);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      media?.removeEventListener("change", changed);
    };
  }, [flying]);
  useEffect(() => {
    if (
      run.completedRounds.length > 0 &&
      (round.phase === "answering" || round.phase === "resolved")
    )
      heading.current?.focus();
  }, [round.phase, run.completedRounds.length]);
  if (round.phase === "resolved") {
    const { lock, distribution, score } = round.result;
    const exhausted = nextQuestion(run).status === "exhausted";
    return (
      <section
        className="mt-8 rounded-2xl border border-[#344354] bg-[#172334] p-5 sm:p-8"
        aria-labelledby="result-title"
      >
        <RocketWorld round={round} />
        <h2
          id="result-title"
          ref={heading}
          tabIndex={-1}
          className="text-2xl font-bold"
        >
          Round result
        </h2>
        <p className="mt-3">{lock.question.prompt}</p>
        <div role="status" className="mt-5 space-y-2">
          <p>Your answer: {lock.answer.toUpperCase()}</p>
          <p>Your prediction: {lock.guessPercentage}% YES</p>
          <p>Actual YES: {distribution.yesPercentage}%</p>
          <p>Error: {score.error} percentage points</p>
          <p className="font-bold text-[#f5c879]">
            Distance: {score.distance} ly
          </p>
        </div>
        {exhausted ? (
          <p className="mt-6">
            Practice complete — you’ve explored every demo question.
          </p>
        ) : (
          <button
            className="primary-button mt-6 w-full"
            onClick={(event) => {
              // A rapid second click on Lock can land here after the layout changes.
              if (event.detail > 1) return;
              setRun((current) =>
                current.round.phase === "resolved"
                  ? startNext(current)
                  : current
              );
            }}
          >
            Continue
          </button>
        )}
      </section>
    );
  }
  if (round.phase === "idle")
    return <p role="status">Practice questions are unavailable.</p>;
  if (
    round.phase === "locked" ||
    round.phase === "flight" ||
    round.phase === "reveal"
  ) {
    const lock = "lock" in round ? round.lock : round.result.lock;
    return (
      <section
        className="mt-8 rounded-2xl border border-[#344354] bg-[#172334] p-5 sm:p-8"
        aria-labelledby="flight-title"
      >
        <RocketWorld round={round} elapsed={elapsed} />
        <h2 id="flight-title" className="text-2xl font-bold">
          Prediction locked
        </h2>
        <p className="mt-3">{lock.question.prompt}</p>
        <p className="mt-3">Your prediction: {lock.guessPercentage}% YES</p>
        <div role="status" className="mt-5 space-y-2">
          {round.phase === "reveal" ? (
            <>
              <p>Actual YES: {round.result.distribution.yesPercentage}%</p>
              <p>Error: {round.result.score.error} percentage points</p>
              <p>
                {round.result.score.error === 0
                  ? "Perfect landing!"
                  : round.result.score.survived
                    ? "Close landing — destination reached."
                    : "Off course — drifting past the destination."}
              </p>
            </>
          ) : (
            <p>Launching toward your prediction…</p>
          )}
        </div>
        <button
          className="primary-button mt-6 w-full"
          disabled={round.phase !== "reveal"}
          onClick={() =>
            setPlayback((current) =>
              updateFlight(current, current.elapsed ?? 0, "skip")
            )
          }
        >
          Skip flight
        </button>
      </section>
    );
  }
  if (round.phase !== "answering" && round.phase !== "aiming") return null;
  const choose = (answer: PersonalAnswer) =>
    setRun((current) => {
      const chosen = transitionRun(current, { type: "choose_answer", answer });
      return chosen.round.phase === "aiming" &&
        chosen.round.guessPercentage === null
        ? transitionRun(chosen, { type: "aim", percentage: 50 })
        : chosen;
    });
  return (
    <section
      aria-labelledby="question"
      className="mt-8 rounded-2xl border border-[#344354] bg-[#172334] p-5 sm:p-8"
    >
      <RocketWorld round={round} />
      <p className="text-sm text-[#b4c2d1]">Practice flight</p>
      <h2
        id="question"
        ref={heading}
        tabIndex={-1}
        className="mt-3 text-2xl font-bold"
      >
        {round.question.prompt}
      </h2>
      <fieldset className="mt-6">
        <legend>Your own answer</legend>
        <div className="mt-2 flex gap-3">
          {(["yes", "no"] as const).map((answer) => (
            <label
              key={answer}
              className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-3 rounded-lg border border-[#6d8399] px-4"
            >
              <input
                type="radio"
                name="answer"
                value={answer}
                checked={round.phase === "aiming" && round.answer === answer}
                onChange={() => choose(answer)}
              />
              {answer.toUpperCase()}
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor="prediction" className="mt-6 block font-bold">
        What percentage of players chose YES?
      </label>
      <p id="aim-help" className="mt-2 text-sm text-[#b4c2d1]">
        Always predict YES, even if your own answer is NO.
      </p>
      <output
        htmlFor="prediction"
        className="mt-4 block text-3xl font-bold text-[#f5c879]"
      >
        {round.phase === "aiming" ? round.guessPercentage : 50}% YES
      </output>
      <input
        id="prediction"
        type="range"
        min="0"
        max="100"
        step="1"
        value={round.phase === "aiming" ? (round.guessPercentage ?? 50) : 50}
        disabled={round.phase !== "aiming"}
        aria-describedby="aim-help"
        className="mt-2 min-h-12 w-full accent-[#f5c879]"
        onChange={(event) =>
          setRun((current) =>
            transitionRun(current, {
              type: "aim",
              percentage: Number(event.target.value),
            })
          )
        }
      />
      <div
        className="flex justify-between text-sm text-[#b4c2d1]"
        aria-hidden="true"
      >
        <span>0% YES</span>
        <span>100% YES</span>
      </div>
      <button
        disabled={round.phase !== "aiming"}
        className="primary-button mt-6 w-full"
        onClick={() =>
          setRun((current) => {
            if (
              current.round.phase !== "aiming" ||
              current.round.guessPercentage === null
            )
              return current;
            return transitionRun(current, { type: "lock" });
          })
        }
      >
        Lock prediction
      </button>
    </section>
  );
}
