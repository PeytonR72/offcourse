"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlayManifest, PlayReply } from "../../domain/server-play";
import {
  createRun,
  transitionRun,
  type PersonalAnswer,
} from "../../domain/run";
import type { RunMode } from "../../domain/scoring";
import { RoundPlayer, type Playback } from "../round-player";
import {
  loadPlaySession,
  savePlaySession,
  type PlaySession,
} from "./play-session";
import { RocketWorld } from "../../world/rocket-world";

async function post(path: string, body: unknown): Promise<PlayManifest> {
  const response = await fetch(path, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const reply: PlayReply = await response.json();
  if (response.status === 409 && reply.status === "conflict" && "play" in reply)
    return reply.play;
  if (!response.ok || reply.status !== "ok") throw new Error(reply.status);
  return reply.play;
}

function resultPlayback(play: PlayManifest): Playback | null {
  const last = play.results.at(-1);
  if (!last) return null;
  return {
    run: {
      ...createRun(play.id, play.mode),
      completedRounds: play.results,
      totalDistance: play.totalDistance,
      status: play.status === "lost" ? "lost" : "active",
      round: { phase: "resolved", result: last },
    },
  };
}

function nextPlayback(play: PlayManifest, session: PlaySession): Playback {
  const index = play.results.length;
  const entry = play.questions[index];
  let run = transitionRun(
    {
      ...createRun(play.id, play.mode),
      completedRounds: play.results,
      totalDistance: play.totalDistance,
    },
    { type: "start_round", roundId: `${play.id}:${index}`, ...entry }
  );
  const draft = session.draft;
  if (draft?.runId === play.id && draft.prediction.roundIndex === index) {
    run = transitionRun(run, {
      type: "choose_answer",
      answer: draft.prediction.answer,
    });
    run = transitionRun(run, {
      type: "aim",
      percentage: draft.prediction.guessPercentage,
    });
  }
  return { run };
}

export function ServerPlay({ mode }: { mode: RunMode }) {
  const session = useRef<PlaySession | null>(null);
  const busy = useRef(false);
  const [play, setPlay] = useState<PlayManifest | null>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingPrediction, setPendingPrediction] =
    useState<PlaySession["pending"]>();
  const questions = useMemo(
    () =>
      play?.results.map((result) => ({
        question: result.lock.question,
        distribution: result.distribution,
      })) ?? [],
    [play]
  );

  const connect = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setWaiting(true);
    setError(null);
    try {
      session.current ??= loadPlaySession(mode);
      const saved = session.current;
      savePlaySession(mode, saved);
      const pending = saved.pending;
      setPendingPrediction(pending);
      const official = pending
        ? await post(`/api/play/${pending.runId}/lock`, {
            installationId: saved.installationId,
            ...pending.prediction,
          })
        : await post("/api/play", {
            installationId: saved.installationId,
            requestId: saved.requestId,
            mode,
          });
      session.current = { ...saved, pending: undefined };
      savePlaySession(mode, session.current);
      setPlay(official);
      const result = pending && official.results[pending.prediction.roundIndex];
      const recovered =
        result &&
        (result.lock.answer !== pending.prediction.answer ||
          result.lock.guessPercentage !== pending.prediction.guessPercentage);
      if (recovered)
        setNotice(
          "Another tab already locked this round. The official server record has been recovered."
        );
      if (
        result &&
        !recovered &&
        official.results.length === pending.prediction.roundIndex + 1
      ) {
        setPlayback({
          run: {
            ...createRun(official.id, official.mode),
            completedRounds: official.results.slice(0, -1),
            totalDistance: official.totalDistance - result.score.distance,
            round: { phase: "locked", lock: result.lock },
          },
        });
      } else if (
        official.status === "active" &&
        saved.draft?.runId === official.id &&
        saved.draft.prediction.roundIndex === official.results.length
      ) {
        setPlayback(nextPlayback(official, session.current));
      } else
        setPlayback(
          resultPlayback(official) ?? nextPlayback(official, session.current)
        );
    } catch (failure) {
      const message =
        failure instanceof Error ? failure.message : "unavailable";
      setError(
        message === "rate_limited"
          ? "Too many requests. Wait a minute, then retry."
          : message === "conflict"
            ? "This prediction differs from the server record. Reload to recover the official result."
            : "Connection or browser storage unavailable. Your prediction is held; retry when ready. No result is shown until the server confirms it."
      );
    } finally {
      busy.current = false;
      setWaiting(false);
    }
  }, [mode]);

  useEffect(() => {
    // Deferring avoids updates during mounting, and keeps the request id stable.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void connect();
    });
    return () => {
      cancelled = true;
    };
  }, [connect]);

  const update = useCallback((change: (current: Playback) => Playback) => {
    setPlayback((current) => (current ? change(current) : current));
  }, []);

  useEffect(() => {
    if (playback?.run.round.phase !== "aiming" || !session.current) return;
    const round = playback.run.round;
    session.current = {
      ...session.current,
      draft: {
        runId: playback.run.id,
        prediction: {
          roundIndex: playback.run.completedRounds.length,
          answer: round.answer,
          guessPercentage: round.guessPercentage ?? 50,
        },
      },
    };
    try {
      savePlaySession(mode, session.current);
    } catch {
      /* Lock remains blocked if durable storage is unavailable. */
    }
  }, [mode, playback]);

  const lock = (answer: PersonalAnswer, guessPercentage: number) => {
    if (!session.current || !play || busy.current) return;
    session.current = {
      ...session.current,
      pending: {
        runId: play.id,
        prediction: {
          roundIndex: play.results.length,
          answer,
          guessPercentage,
        },
      },
    };
    // connect persists the immutable pending payload before making any request.
    void connect();
  };

  if (waiting || error)
    return (
      <section className="mt-8 rounded-2xl border border-[#344354] bg-[#172334] p-5 sm:p-8">
        {playback && <RocketWorld run={playback.run} paused />}
        <h2 className="text-2xl font-bold">
          {pendingPrediction
            ? "Prediction held"
            : "Connecting to mission control"}
        </h2>
        {pendingPrediction && (
          <p className="mt-3">
            Your prediction: {pendingPrediction.prediction.guessPercentage}%
            YES. It cannot be changed while confirmation is pending.
          </p>
        )}
        <p role="status" className="mt-3">
          {error ?? "Waiting for the official server record…"}
        </p>
        {error && (
          <button
            className="primary-button mt-6 w-full"
            onClick={() => void connect()}
          >
            Retry connection
          </button>
        )}
      </section>
    );
  if (!play || !playback) return null;
  const summary =
    play.status === "lost"
      ? "Voyage ended — off course."
      : play.status === "exhausted"
        ? "Every eligible destination reached — pool complete."
        : play.status === "complete"
          ? "Daily Expedition complete."
          : undefined;
  return (
    <>
      {notice && (
        <p role="status" className="mt-4">
          {notice}
        </p>
      )}
      <p role="status" className="mt-5">
        {play.dateKey} UTC · Distance: {playback.run.totalDistance} ly ·
        Destinations reached:{" "}
        {
          playback.run.completedRounds.filter((result) => result.score.survived)
            .length
        }
      </p>
      <RoundPlayer
        playback={playback}
        update={update}
        label={`Round ${playback.run.completedRounds.length + (playback.run.round.phase === "resolved" ? 0 : 1)} of ${play.questions.length}`}
        questions={questions}
        onLock={lock}
        completionText={summary}
        onContinue={
          play.status === "active"
            ? () => setPlayback(nextPlayback(play, session.current!))
            : undefined
        }
      />
      {playback.run.round.phase === "resolved" && (
        <p className="mt-4 text-[#b4c2d1]">
          Sample: {playback.run.round.result.distribution.sampleSize} ·{" "}
          {playback.run.round.result.distribution.sourceAttribution}
        </p>
      )}
      {play.status !== "active" &&
        mode === "endless" &&
        playback.run.round.phase === "resolved" && (
          <button
            className="secondary-button mt-5 w-full"
            onClick={() => {
              session.current = {
                installationId: session.current!.installationId,
                requestId: crypto.randomUUID(),
              };
              void connect();
            }}
          >
            New voyage
          </button>
        )}
    </>
  );
}
