"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { demoCatalog } from "../../data/demo-questions";
import {
  createEndless,
  endlessProgress,
  nextEndless,
} from "../../domain/endless";
import { createEndlessRepository } from "../../domain/endless-repository";
import { RocketWorld } from "../../world/rocket-world";
import { RoundPlayer, type Playback } from "../round-player";
import { Stat, StatsBar } from "../stats-bar";
import { ProgressNotice, SessionStorageNotice } from "../progress-notice";
import type { createBrowserStorage } from "../../domain/browser-storage";
import { useProgressStorage } from "../progress-storage";

type Repository = ReturnType<typeof createEndlessRepository>;
type Session = ReturnType<Repository["load"]> & { elapsed?: number };
type Loaded = {
  initial: Session;
  repository: Repository;
  storage: ReturnType<typeof createBrowserStorage>;
};

export function Endless() {
  const getStorage = useProgressStorage();
  const [loaded, setLoaded] = useState<Loaded>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const storage = getStorage();
        const repository = createEndlessRepository(
          storage,
          demoCatalog,
          Math.random
        );
        setLoaded({ initial: repository.load(), repository, storage });
      } catch {
        setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [getStorage]);
  if (error)
    return (
      <ProgressNotice message="Voyage progress could not be restored safely. Your saved records have been preserved." />
    );
  if (!loaded)
    return (
      <p role="status" className="flight-loading mt-8">
        Preparing your voyage…
      </p>
    );
  return <EndlessGame {...loaded} />;
}

function EndlessGame({ initial, repository, storage }: Loaded) {
  const [session, setSession] = useState(initial);
  const current = useRef(session);
  const [error, setError] = useState<string>();
  const failed = useRef(false);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  const progressHeading = useRef<HTMLSpanElement>(null);
  const update = useCallback(
    (change: (current: Playback) => Playback) => {
      if (failed.current) return;
      const previous = current.current;
      const next = change({
        run: previous.voyage.run,
        elapsed: previous.elapsed,
      });
      try {
        const voyage = { ...previous.voyage, run: next.run };
        const best =
          next.run === previous.voyage.run
            ? previous.best
            : repository.save(voyage);
        current.current = { voyage, best, elapsed: next.elapsed };
        setSession(current.current);
      } catch (cause) {
        failed.current = true;
        setError(
          cause instanceof Error
            ? cause.message
            : "Voyage progress could not be saved. Reload to resume."
        );
      }
    },
    [repository]
  );
  const { voyage, best, elapsed } = session;
  const { run } = voyage;
  const progress = endlessProgress(voyage);
  const complete = progress.status !== "active";
  useEffect(() => {
    if (complete) summaryHeading.current?.focus();
  }, [complete]);
  if (error) return <ProgressNotice message={error} />;
  const restart = () => {
    if (failed.current) return;
    try {
      const voyage = createEndless(demoCatalog, Math.random);
      current.current = { voyage, best: repository.save(voyage) };
      setSession(current.current);
      progressHeading.current?.focus();
    } catch {
      failed.current = true;
      setError("Voyage could not be restarted safely. Reload to resume.");
    }
  };
  return (
    <>
      {!storage.persistent && <SessionStorageNotice />}
      <StatsBar className="endless-stats">
        <Stat
          label="Current streak"
          value={progress.streak}
          primary
          statRef={progressHeading}
        />
        <Stat label="Run distance" value={progress.distance} unit="ly" />
        <Stat label="Best streak" value={best.streak} record />
        <Stat label="Best distance" value={best.distance} unit="ly" record />
      </StatsBar>
      {complete ? (
        <section
          aria-labelledby="endless-summary"
          className="round-card mission-complete"
        >
          <div className="completion-stage">
            <RocketWorld run={run} caption="Voyage logged" />
            <div className="completion-heading">
              <p className="eyebrow">Every guess takes you somewhere.</p>
              <h2
                id="endless-summary"
                ref={summaryHeading}
                tabIndex={-1}
                className="text-2xl font-bold"
              >
                {progress.status === "lost"
                  ? "Voyage ended"
                  : "Voyage complete"}
              </h2>
              <p className="completion-distance">
                <strong>{progress.streak}</strong>{" "}
                {progress.streak === 1 ? "destination" : "destinations"} reached
              </p>
              <p className="completion-streak">Longest streak: {best.streak}</p>
              <p className="mt-3">{progress.distance} light-years traveled</p>
              <p role="status" className="mt-3">
                {progress.status === "lost"
                  ? "Your prediction missed by more than 10 percentage points. The losing round earns 0 ly."
                  : "Every eligible demo question explored. You reached the end of the question pool — no destination missed."}
              </p>
            </div>
          </div>
          <div className="completion-details">
            <div className="completion-actions">
              <button
                className="primary-button w-full"
                onClick={(event) => {
                  if (event.detail <= 1) restart();
                }}
              >
                Restart voyage
              </button>
              <Link
                href="/daily"
                className="secondary-button mt-3 flex items-center justify-center"
              >
                Play Daily Expedition
              </Link>
            </div>
            {run.round.phase === "resolved" ? (
              <div className="completion-log last-destination">
                <h3 className="eyebrow">Last destination</h3>
                <p className="log-prompt">
                  {run.round.result.lock.question.prompt}
                </p>
                <p>
                  Your prediction: {run.round.result.lock.guessPercentage}% YES
                </p>
                <p>
                  Actual YES: {run.round.result.distribution.yesPercentage}%
                </p>
                <p>Error: {run.round.result.score.error} percentage points</p>
                <p>Last round distance: {run.round.result.score.distance} ly</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <RoundPlayer
          playback={{ run, elapsed }}
          update={update}
          questions={voyage.questions}
          label="Endless Voyage · illustrative results"
          onContinue={() =>
            update((value) =>
              value.run.round.phase === "resolved"
                ? { run: nextEndless({ ...voyage, run: value.run }).run }
                : value
            )
          }
        />
      )}
      <p className="mission-footnote">
        Questions never repeat within a run. Explore until you miss or complete
        the available demo pool.
      </p>
      <details className="mission-notes">
        <summary>About your voyage &amp; records</summary>
        <p>
          Progress and best records are saved on this browser when storage is
          available. Clearing storage resets them; records do not sync across
          devices. Simulated percentages are for demo play only, with no public
          ranked score.
        </p>
      </details>
    </>
  );
}
