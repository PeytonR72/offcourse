"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { demoCatalog } from "../../data/demo-questions";
import { nextDaily, type DailyExpedition } from "../../domain/daily";
import { createDailyRepository } from "../../domain/daily-repository";
import { dailySummary } from "../../domain/daily-summary";
import { ShareSummary } from "../share-summary";
import { RoundPlayer, type Playback } from "../round-player";
import { ProgressNotice, SessionStorageNotice } from "../progress-notice";
import type { createBrowserStorage } from "../../domain/browser-storage";
import { useProgressStorage } from "../progress-storage";
import { RocketWorld } from "../../world/rocket-world";
import { DistanceMeter, RoundMeter, StatsBar } from "../stats-bar";

type Repository = ReturnType<typeof createDailyRepository>;
type Loaded = {
  daily: DailyExpedition;
  repository: Repository;
  storage: ReturnType<typeof createBrowserStorage>;
};

export function Daily() {
  const getStorage = useProgressStorage();
  const [loaded, setLoaded] = useState<Loaded>();
  const [error, setError] = useState(false);
  useEffect(() => {
    const storage = getStorage();
    let dateKey = "";
    let timer: ReturnType<typeof setTimeout>;
    const load = () => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      if (today !== dateKey) {
        try {
          const repository = createDailyRepository(
            storage,
            demoCatalog,
            () => new Date()
          );
          setLoaded({ daily: repository.load(), repository, storage });
          setError(false);
        } catch {
          setLoaded(undefined);
          setError(true);
        }
        dateKey = today;
      }
      clearTimeout(timer);
      timer = setTimeout(
        load,
        Date.parse(`${today}T00:00:00Z`) + 86400000 - now.getTime()
      );
    };
    load();
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", load);
    };
  }, [getStorage]);
  if (error)
    return (
      <ProgressNotice message="Daily progress could not be restored safely. Your saved attempt has been preserved." />
    );
  if (!loaded)
    return (
      <p role="status" className="flight-loading mt-8">
        Loading today’s expedition…
      </p>
    );
  return <DailyGame key={loaded.daily.dateKey} {...loaded} />;
}

function DailyGame({ daily, repository, storage }: Loaded) {
  const [playback, setPlayback] = useState<Playback>({ run: daily.run });
  const current = useRef(playback);
  const [error, setError] = useState<string>();
  const failed = useRef(false);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  const update = useCallback(
    (change: (current: Playback) => Playback) => {
      if (failed.current) return;
      const next = change(current.current);
      try {
        if (next.run !== current.current.run)
          repository.save({ ...daily, run: next.run });
        current.current = next;
        setPlayback(next);
      } catch (cause) {
        failed.current = true;
        setError(
          cause instanceof Error
            ? cause.message
            : "Daily progress could not be saved. Reload to resume."
        );
      }
    },
    [daily, repository]
  );
  const { run } = playback;
  const complete = run.completedRounds.length === 5;
  const summary = complete ? dailySummary({ ...daily, run }) : undefined;
  useEffect(() => {
    if (complete) summaryHeading.current?.focus();
  }, [complete]);
  if (error) return <ProgressNotice message={error} />;
  const reset = new Date(Date.parse(`${daily.dateKey}T00:00:00Z`) + 86400000);
  return (
    <>
      {!storage.persistent && <SessionStorageNotice />}
      <p className="stats-meta">
        {daily.dateKey}
        <span className="hud-detail"> · UTC expedition</span>
      </p>
      {!complete && (
        <StatsBar className="daily-stats">
          <RoundMeter
            current={Math.min(
              run.completedRounds.length +
                (run.round.phase === "resolved" ? 0 : 1),
              5
            )}
            completed={run.completedRounds.length}
            total={5}
          />
          <DistanceMeter distance={run.totalDistance} max={500} />
        </StatsBar>
      )}
      {complete ? (
        <section
          className="round-card mission-complete"
          aria-labelledby="daily-summary"
        >
          <div className="completion-stage">
            <RocketWorld run={run} caption="Expedition logged" />
            <div className="completion-heading">
              <p className="eyebrow">Five destinations. One expedition.</p>
              <h2
                id="daily-summary"
                ref={summaryHeading}
                tabIndex={-1}
                className="text-2xl font-bold"
              >
                Daily complete
              </h2>
              <p role="status" className="completion-distance">
                <strong>{run.totalDistance}</strong> light-years traveled
              </p>
              <DistanceMeter
                distance={run.totalDistance}
                max={500}
                showValue={false}
              />
              <p className="mt-3">
                5 of 5 destinations explored. Every prediction counts, including
                misses.
              </p>
              {summary && (
                <>
                  <p className="completion-accuracy">
                    Prediction accuracy: <strong>{summary.accuracy}%</strong>
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Average error: {summary.averageError} percentage points.
                    Accuracy is 100 minus average error.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="completion-details">
            <div className="completion-actions">
              <h3 className="font-bold">A journey worth sharing.</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Take your flight log with you. A new expedition awaits tomorrow.
              </p>
              {summary && <ShareSummary text={summary.text} />}
              <p className="mt-6 text-sm">
                Already played today. Your next Daily Expedition unlocks at
                00:00 UTC.
              </p>
              <div className="completion-links">
                <Link className="primary-button" href="/endless">
                  Play Endless Voyage
                </Link>
                <Link className="secondary-button" href="/">
                  Play practice
                </Link>
              </div>
            </div>
            <div className="completion-log">
              <h3 className="eyebrow">Your flight log</h3>
              <ol aria-label="Daily round results">
                {run.completedRounds.map(
                  ({ lock, distribution, score }, index) => (
                    <li key={lock.roundId}>
                      <div>
                        <p className="log-prompt">
                          {index + 1}. {lock.question.prompt}
                        </p>
                        <p className="log-detail">
                          Predicted {lock.guessPercentage}% YES · Actual{" "}
                          {distribution.yesPercentage}% · Error {score.error}{" "}
                          points
                        </p>
                      </div>
                      <strong className="log-distance">
                        {score.distance} <span>ly</span>
                      </strong>
                    </li>
                  )
                )}
              </ol>
            </div>
          </div>
        </section>
      ) : (
        <>
          <RoundPlayer
            playback={playback}
            update={update}
            questions={daily.questions}
            label="Daily Expedition · illustrative results"
            onContinue={() =>
              update((value) =>
                value.run.round.phase === "resolved"
                  ? { run: nextDaily({ ...daily, run: value.run }).run }
                  : value
              )
            }
          />
        </>
      )}
      <p className="mission-footnote">
        Next expedition:{" "}
        <time dateTime={reset.toISOString()}>
          {reset.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>{" "}
        (your local time; resets 00:00 UTC). Everyone gets the same five
        questions each UTC day.
      </p>
      <details className="mission-notes">
        <summary>About your daily flight</summary>
        <p>
          One daily attempt per browser when storage is available. Clearing
          storage resets participation; records do not sync across devices. This
          demo uses simulated percentages and records no public ranked score.
        </p>
      </details>
    </>
  );
}
