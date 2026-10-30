"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { demoCatalog } from "../../data/demo-questions";
import { nextDaily, type DailyExpedition } from "../../domain/daily";
import { createDailyRepository } from "../../domain/daily-repository";
import { RoundPlayer, type Playback } from "../round-player";
import { ProgressNotice } from "../progress-notice";
import { RocketWorld } from "../../world/rocket-world";

type Repository = ReturnType<typeof createDailyRepository>;
type Loaded = { daily: DailyExpedition; repository: Repository };

export function Daily() {
  const [loaded, setLoaded] = useState<Loaded>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let dateKey = "";
    let timer: ReturnType<typeof setTimeout>;
    const load = () => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      if (today !== dateKey) {
        try {
          const repository = createDailyRepository(
            window.localStorage,
            demoCatalog,
            () => new Date()
          );
          setLoaded({ daily: repository.load(), repository });
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
  }, []);
  if (error)
    return (
      <ProgressNotice message="Daily progress could not be saved or restored. Daily play needs available browser storage." />
    );
  if (!loaded)
    return (
      <p role="status" className="mt-8">
        Loading today’s expedition…
      </p>
    );
  return <DailyGame key={loaded.daily.dateKey} {...loaded} />;
}

function DailyGame({ daily, repository }: Loaded) {
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
  useEffect(() => {
    if (complete) summaryHeading.current?.focus();
  }, [complete]);
  if (error) return <ProgressNotice message={error} />;
  const reset = new Date(Date.parse(`${daily.dateKey}T00:00:00Z`) + 86400000);
  return (
    <>
      <div className="mt-8 space-y-2">
        <p className="text-sm text-[#b4c2d1]">
          {daily.dateKey} · UTC expedition
        </p>
        <p className="font-bold text-[#f5c879]">
          Total distance: {run.totalDistance} ly / 500 ly
        </p>
        <p>
          Next expedition:{" "}
          <time dateTime={reset.toISOString()}>
            {reset.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>{" "}
          (your local time; resets 00:00 UTC).
        </p>
      </div>
      {complete ? (
        <section
          className="mt-6 rounded-2xl border border-[#344354] bg-[#172334] p-5 sm:p-8"
          aria-labelledby="daily-summary"
        >
          <RocketWorld round={run.round} />
          <h2
            id="daily-summary"
            ref={summaryHeading}
            tabIndex={-1}
            className="text-2xl font-bold"
          >
            Daily complete
          </h2>
          <p role="status" className="mt-3 text-xl font-bold text-[#f5c879]">
            {run.totalDistance} light-years traveled
          </p>
          <p className="mt-3">
            5 of 5 destinations explored. Every prediction counts, including
            misses.
          </p>
          <ol className="mt-5 space-y-4" aria-label="Daily round results">
            {run.completedRounds.map(({ lock, distribution, score }, index) => (
              <li key={lock.roundId}>
                <p className="font-bold">
                  {index + 1}. {lock.question.prompt}
                </p>
                <p className="mt-1 text-[#c4d1dd]">
                  Predicted {lock.guessPercentage}% YES · Actual{" "}
                  {distribution.yesPercentage}% · Error {score.error} points ·{" "}
                  {score.distance} ly
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6">
            Already played today. Your next Daily Expedition unlocks at 00:00
            UTC.
          </p>
          <Link
            className="primary-button mt-6 flex items-center justify-center"
            href="/"
          >
            Play practice
          </Link>
        </section>
      ) : (
        <>
          <p className="mt-5 font-bold">
            Round{" "}
            {Math.min(
              run.completedRounds.length +
                (run.round.phase === "resolved" ? 0 : 1),
              5
            )}{" "}
            of 5
          </p>
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
      <p className="mt-6 text-sm leading-relaxed text-[#b4c2d1]">
        One daily attempt per browser, saved on this device. Clearing storage
        resets participation; records do not sync across devices. This demo uses
        simulated percentages and records no public ranked score.
      </p>
    </>
  );
}
