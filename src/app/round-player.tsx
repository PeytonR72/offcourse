"use client";

import { useEffect, useRef, useState } from "react";
import type { QuestionSnapshot } from "../domain/questions";
import { transitionRun, type PersonalAnswer, type Run } from "../domain/run";
import { FlightDeck } from "./flight-deck";
import { FlightIcon } from "./flight-icon";
import { advanceFlight, flightTiming } from "../world/flight";
import { useExperience } from "./experience";
import { motion } from "motion/react";
import { toSceneState } from "../world/scene-state";

const cardSpring = {
  type: "spring",
  stiffness: 360,
  damping: 26,
  mass: 0.6,
} as const;

export type Playback = { run: Run; elapsed?: number };

function updateFlight(
  current: Playback,
  elapsed: number,
  action: "skip" | "reduced" | undefined,
  questions: readonly QuestionSnapshot[]
): Playback {
  const round = current.run.round;
  if (
    round.phase !== "locked" &&
    round.phase !== "flight" &&
    round.phase !== "reveal"
  )
    return current;
  const lock = "lock" in round ? round.lock : round.result.lock;
  const entry = questions.find(
    ({ distribution }) => distribution.id === lock.question.distributionId
  )!;
  return {
    run: advanceFlight(current.run, entry.distribution, elapsed, action),
    elapsed,
  };
}

export function RoundPlayer({
  playback,
  update,
  questions,
  label,
  onContinue,
  completionText,
  onLock,
}: {
  playback: Playback;
  update: (change: (current: Playback) => Playback) => void;
  questions: readonly QuestionSnapshot[];
  label: string;
  onContinue?: () => void;
  completionText?: string;
  onLock?: (answer: PersonalAnswer, guessPercentage: number) => void;
}) {
  const { run, elapsed } = playback;
  const { reducedMotion, launch, reveal, stopFeedback } = useExperience();
  const setRun = (change: (current: Run) => Run) =>
    update((current) => ({ run: change(current.run) }));
  const heading = useRef<HTMLHeadingElement>(null);
  const [paused, setPaused] = useState(false);
  const resumeButton = useRef<HTMLButtonElement>(null);
  const flightElapsed = useRef(0);
  const wasPaused = useRef(false);
  const round = run.round;
  const flying =
    round.phase === "locked" ||
    round.phase === "flight" ||
    round.phase === "reveal";
  const canPause = round.phase !== "resolved" && round.phase !== "idle";
  useEffect(() => () => stopFeedback(), [stopFeedback]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden && canPause) {
        stopFeedback();
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, [stopFeedback, canPause]);
  useEffect(() => {
    if (paused) resumeButton.current?.focus();
    else if (wasPaused.current) heading.current?.focus();
    wasPaused.current = paused;
  }, [paused]);
  useEffect(() => {
    if (!flying) {
      flightElapsed.current = 0;
      return;
    }
    if (paused) return;
    const started = performance.now() - flightElapsed.current;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const tick = () => {
      if (document.hidden) return;
      const elapsed = performance.now() - started;
      flightElapsed.current = elapsed;
      update((current) =>
        updateFlight(
          current,
          elapsed,
          reducedMotion || media?.matches ? "reduced" : undefined,
          questions
        )
      );
      if (elapsed < flightTiming.settled && !reducedMotion && !media?.matches)
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
  }, [flying, update, questions, reducedMotion, paused]);
  const outcome = toSceneState(round).outcome;
  useEffect(() => {
    if (outcome) reveal(outcome);
  }, [outcome, reveal]);
  useEffect(() => {
    if (
      run.completedRounds.length > 0 &&
      (round.phase === "answering" || round.phase === "resolved")
    )
      heading.current?.focus();
  }, [round.phase, run.completedRounds.length]);
  const pauseControl = (
    <button
      className="secondary-button pause-button mt-3 w-full"
      onClick={(event) => {
        // Lock changes the layout; its second click can land on Pause.
        if (event.detail > 1) return;
        stopFeedback();
        setPaused(true);
      }}
    >
      Pause
    </button>
  );
  if (paused && canPause)
    return (
      <motion.section
        initial={false}
        animate={{ y: 0, scale: 1 }}
        transition={cardSpring}
        className="round-card"
        aria-labelledby="pause-title"
      >
        <FlightDeck run={run} elapsed={elapsed} paused />
        <div className="console-controls">
          <h2 id="pause-title" className="text-2xl font-bold">
            Flight paused
          </h2>
          <p className="mt-3">
            Your answer and prediction are held. Resume when you’re ready.
          </p>
          <button
            ref={resumeButton}
            className="primary-button mt-6 w-full"
            onClick={() => {
              setPaused(false);
            }}
          >
            Resume
          </button>
        </div>
      </motion.section>
    );
  if (round.phase === "resolved") {
    const { lock, distribution, score } = round.result;
    return (
      <motion.section
        initial={false}
        animate={{ y: 0, scale: 1 }}
        transition={cardSpring}
        className="round-card"
        aria-labelledby="result-title"
      >
        <FlightDeck run={run} />
        <div className="console-controls">
          <p className="result-verdict">
            {score.error === 0
              ? "Perfect landing!"
              : score.survived
                ? "Destination reached"
                : "A little off course"}
          </p>
          <h2
            id="result-title"
            ref={heading}
            tabIndex={-1}
            className="text-2xl font-bold"
          >
            Round result
          </h2>
          <p className="mt-3">{lock.question.prompt}</p>
          <div role="status" className="result-stats result-summary">
            <p className="distance-earned">
              <span>Distance: </span>
              <strong>{score.distance} ly</strong>
            </p>
            <p>Your answer: {lock.answer.toUpperCase()}</p>
            <p>Your prediction: {lock.guessPercentage}% YES</p>
            <p>Actual YES: {distribution.yesPercentage}%</p>
            <p>Error: {score.error} percentage points</p>
          </div>
          {!onContinue ? (
            <p className="mt-6">{completionText}</p>
          ) : (
            <button
              className="primary-button mt-6 w-full"
              onClick={(event) => {
                // A rapid second click on Lock can land here after the layout changes.
                if (event.detail > 1) return;
                onContinue();
              }}
            >
              Continue
            </button>
          )}
        </div>
      </motion.section>
    );
  }
  if (round.phase === "idle")
    return <p role="status">Questions are unavailable.</p>;
  if (
    round.phase === "locked" ||
    round.phase === "flight" ||
    round.phase === "reveal"
  ) {
    const lock = "lock" in round ? round.lock : round.result.lock;
    return (
      <motion.section
        initial={false}
        animate={{ y: -2, scale: 0.997 }}
        transition={cardSpring}
        className="round-card"
        aria-labelledby="flight-title"
      >
        <FlightDeck run={run} elapsed={elapsed} />
        <div className="console-controls">
          <h2
            id="flight-title"
            ref={heading}
            tabIndex={-1}
            className="text-2xl font-bold"
          >
            Prediction locked
          </h2>
          <p className="mt-3">{lock.question.prompt}</p>
          <p className="mt-3">Your prediction: {lock.guessPercentage}% YES</p>
          <div role="status" className="result-stats">
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
              update((current) =>
                updateFlight(current, current.elapsed ?? 0, "skip", questions)
              )
            }
          >
            Skip flight
          </button>
          {pauseControl}
        </div>
      </motion.section>
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
    <motion.section
      initial={false}
      animate={{ y: round.phase === "aiming" ? -2 : 0, scale: 1 }}
      transition={cardSpring}
      aria-labelledby="question"
      className="round-card"
    >
      <FlightDeck run={run} />
      <div className="console-controls">
        <p className="round-label">{label}</p>
        <h2
          id="question"
          ref={heading}
          tabIndex={-1}
          className="mt-3 text-2xl font-bold"
        >
          {round.question.prompt}
        </h2>
        <fieldset className="mt-6">
          <legend>
            <span className="control-step">1</span> Your own answer
          </legend>
          <div className="mt-2 flex gap-3">
            {(["yes", "no"] as const).map((answer) => (
              <label key={answer} className="answer-option">
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
        <div className="aim-heading">
          <label htmlFor="prediction" className="prediction-label font-bold">
            <span className="control-step" aria-hidden="true">
              2
            </span>{" "}
            Predict the YES vote
          </label>
          <output htmlFor="prediction">
            {round.phase === "aiming" ? round.guessPercentage : 50}% YES
          </output>
        </div>
        <p id="aim-help" className="mt-2 text-sm text-[#b4c2d1]">
          Always predict YES, even if your own answer is NO.
          <span className="sr-only">
            {" "}
            {round.question.sourceType === "simulated"
              ? "What percentage of players chose YES?"
              : "What percentage of poll respondents chose YES?"}
          </span>
        </p>
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
          aria-label="Lock prediction"
          aria-describedby="launch-help"
          disabled={round.phase !== "aiming"}
          className="primary-button mt-6 w-full"
          onClick={() => {
            if (round.phase !== "aiming" || round.guessPercentage === null)
              return;
            if (onLock) {
              onLock(round.answer, round.guessPercentage);
              return;
            }
            launch();
            setRun((current) => {
              if (
                current.round.phase !== "aiming" ||
                current.round.guessPercentage === null
              )
                return current;
              return transitionRun(current, { type: "lock" });
            });
          }}
        >
          <FlightIcon />
          Lock prediction
          <span aria-hidden="true">↗</span>
        </button>
        <p id="launch-help" className="launch-hint">
          {round.phase === "aiming"
            ? "Your prediction locks when you launch."
            : "Choose YES or NO to activate launch."}
        </p>
        {pauseControl}
        <details className="aim-instructions">
          <summary>Keyboard controls</summary>
          <p>
            Arrow keys adjust by 1%. Home: 0%. End: 100%. Tab to Lock
            prediction, then press Enter to launch.
          </p>
        </details>
      </div>
    </motion.section>
  );
}
