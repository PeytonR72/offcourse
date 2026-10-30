import { describe, expect, it } from "vitest";
import { createRun, transitionRun, type Run, type RunEvent } from "./run";
import type { Distribution, Question } from "./content";

const question: Question = {
  id: "q1",
  prompt: "Would you visit the Moon?",
  yesLabel: "Yes",
  noLabel: "No",
  category: "space",
  status: "published",
  sourceType: "simulated",
  distributionId: "d1",
};

const distribution: Distribution = {
  id: "d1",
  questionId: "q1",
  version: 1,
  yesPercentage: 62.5,
  sampleSize: 0,
  frozenAt: "2026-10-29T00:00:00Z",
  eligibilityStatus: "ineligible",
};

function startRound(run = createRun("run1", "daily")): Run {
  return transitionRun(run, {
    type: "start_round",
    roundId: "round1",
    question,
    distributionVersion: 1,
  });
}

function lockRound(): Run {
  const aiming = transitionRun(startRound(), {
    type: "choose_answer",
    answer: "yes",
  });
  return transitionRun(transitionRun(aiming, { type: "aim", percentage: 60 }), {
    type: "lock",
  });
}

function revealRound(
  run: Run,
  roundId: string,
  guess: number,
  actual: number
): Run {
  const answering = transitionRun(run, {
    type: "start_round",
    roundId,
    question,
    distributionVersion: 1,
  });
  const aiming = transitionRun(answering, {
    type: "choose_answer",
    answer: "no",
  });
  const aimed = transitionRun(aiming, { type: "aim", percentage: guess });
  const locked = transitionRun(aimed, { type: "lock" });
  const flight = transitionRun(locked, { type: "launch" });
  return transitionRun(flight, {
    type: "reveal",
    distribution: { ...distribution, yesPercentage: actual },
  });
}

describe("run transitions", () => {
  it("continues a daily expedition after misses and sums all five distances", () => {
    let run = createRun("daily1", "daily");
    const guesses = [50, 61, 100, 40, 49];
    const totals = [100, 145, 145, 195, 290];

    for (const [index, guess] of guesses.entries()) {
      expect(run.status).toBe("active");
      run = transitionRun(revealRound(run, `round${index + 1}`, guess, 50), {
        type: "resolve",
      });
      expect(run.totalDistance).toBe(totals[index]);
    }
    expect(run.completedRounds).toHaveLength(5);
    expect(run.completedRounds[1].score).toEqual({
      error: 11,
      survived: false,
      distance: 45,
    });
  });

  it.each([
    [50, 500],
    [100, 0],
  ])("scores five daily guesses of %s as %s light-years", (guess, total) => {
    let run = createRun("daily1", "daily");
    for (let round = 1; round <= 5; round++) {
      run = transitionRun(revealRound(run, `round${round}`, guess, 50), {
        type: "resolve",
      });
    }
    expect(run.totalDistance).toBe(total);
  });

  it("ends an endless voyage when its very first round misses", () => {
    const run = transitionRun(
      revealRound(createRun("run1", "endless"), "round1", 0, 100),
      { type: "resolve" }
    );
    expect(run.status).toBe("lost");
    expect(run.totalDistance).toBe(0);
    expect(() => revealRound(run, "round2", 100, 100)).toThrow();
  });

  it("ends an endless voyage on the first miss and preserves earlier distance", () => {
    const first = transitionRun(
      revealRound(createRun("run1", "endless"), "round1", 60, 50),
      { type: "resolve" }
    );
    expect(first.status).toBe("active");
    expect(first.totalDistance).toBe(50);

    const failed = transitionRun(revealRound(first, "round2", 61, 50), {
      type: "resolve",
    });
    expect(failed.status).toBe("lost");
    expect(failed.totalDistance).toBe(50);
    expect(failed.completedRounds).toHaveLength(2);
    expect(failed.completedRounds[1].score).toEqual({
      error: 11,
      survived: false,
      distance: 0,
    });
    expect(() => revealRound(failed, "round3", 50, 50)).toThrow();
    expect(() => transitionRun(failed, { type: "resolve" })).toThrow();
    expect(first.completedRounds).toHaveLength(1);
    expect(first.status).toBe("active");
  });

  it("credits a resolved round exactly once and retains earlier snapshots", () => {
    const initial = createRun("run1", "daily");
    const reveal = transitionRun(
      transitionRun(lockRound(), { type: "launch" }),
      {
        type: "reveal",
        distribution,
      }
    );
    const resolved = transitionRun(reveal, { type: "resolve" });

    expect(initial.totalDistance).toBe(0);
    expect(reveal.totalDistance).toBe(0);
    expect(resolved.totalDistance).toBe(88);
    expect(resolved.completedRounds[0]).toMatchObject({
      score: { error: 2.5, survived: true, distance: 88 },
    });
    expect(() => transitionRun(resolved, { type: "resolve" })).toThrow();
    expect(resolved.totalDistance).toBe(88);
    expect(reveal.completedRounds).toHaveLength(0);
  });

  it("starts idle, then answers and aims while retaining personal choice", () => {
    const idle = createRun("run1", "daily");
    const answering = startRound(idle);
    const aiming = transitionRun(answering, {
      type: "choose_answer",
      answer: "no",
    });
    const adjusted = transitionRun(aiming, { type: "aim", percentage: 75 });

    expect(idle.round.phase).toBe("idle");
    expect(answering.round.phase).toBe("answering");
    expect(aiming.round.phase).toBe("aiming");
    expect(adjusted.round).toMatchObject({
      phase: "aiming",
      answer: "no",
      guessPercentage: 75,
    });
    expect(adjusted.completedRounds).toEqual([]);
  });

  it.each([-1, 101, 0.5, NaN, Infinity])(
    "rejects invalid guess %s",
    (percentage) => {
      const aiming = transitionRun(startRound(), {
        type: "choose_answer",
        answer: "yes",
      });
      expect(() =>
        transitionRun(aiming, { type: "aim", percentage })
      ).toThrow();
    }
  );

  it.each([0, 100])(
    "locks boundary guess %s without reversing the YES axis",
    (percentage) => {
      const aiming = transitionRun(startRound(), {
        type: "choose_answer",
        answer: "no",
      });
      const aimed = transitionRun(aiming, { type: "aim", percentage });
      const locked = transitionRun(aimed, { type: "lock" });
      expect(locked.round).toMatchObject({
        phase: "locked",
        lock: { answer: "no", guessPercentage: percentage },
      });
    }
  );

  it("requires both a personal answer and an explicit guess before locking", () => {
    const answering = startRound();
    const aiming = transitionRun(answering, {
      type: "choose_answer",
      answer: "yes",
    });
    expect(() => transitionRun(answering, { type: "lock" })).toThrow();
    expect(() => transitionRun(aiming, { type: "lock" })).toThrow();
  });

  it("flies, reveals the pinned distribution, and resolves exactly once", () => {
    const locked = lockRound();
    const flight = transitionRun(locked, { type: "launch" });
    const reveal = transitionRun(flight, { type: "reveal", distribution });
    const resolved = transitionRun(reveal, { type: "resolve" });
    expect(flight.round.phase).toBe("flight");
    expect(reveal.round).toMatchObject({
      phase: "reveal",
      result: {
        distribution: { yesPercentage: 62.5 },
        lock: { guessPercentage: 60 },
      },
    });
    expect(reveal.completedRounds).toHaveLength(0);
    expect(resolved.round.phase).toBe("resolved");
    expect(resolved.completedRounds).toHaveLength(1);
    expect(() => transitionRun(resolved, { type: "resolve" })).toThrow();
    expect(() =>
      transitionRun(resolved, { type: "reveal", distribution })
    ).toThrow();
    expect(() => startRound(resolved)).toThrow();
    const next = transitionRun(resolved, {
      type: "start_round",
      roundId: "round2",
      question,
      distributionVersion: 1,
    });
    expect(next.round.phase).toBe("answering");
    expect(next.completedRounds).toHaveLength(1);
  });

  it("rejects reveals from another question, snapshot, or version", () => {
    const flight = transitionRun(lockRound(), { type: "launch" });
    for (const changes of [
      { id: "d2" },
      { questionId: "q2" },
      { version: 2 },
      { yesPercentage: 101 },
    ]) {
      expect(() =>
        transitionRun(flight, {
          type: "reveal",
          distribution: { ...distribution, ...changes },
        })
      ).toThrow();
    }
    expect(flight.round.phase).toBe("flight");
    expect(flight.completedRounds).toEqual([]);
  });

  it("rejects every out-of-order event across all seven phases", () => {
    const idle = createRun("run1", "endless");
    const answering = startRound(idle);
    const aiming = transitionRun(answering, {
      type: "choose_answer",
      answer: "yes",
    });
    const locked = lockRound();
    const flight = transitionRun(locked, { type: "launch" });
    const reveal = transitionRun(flight, { type: "reveal", distribution });
    const resolved = transitionRun(reveal, { type: "resolve" });
    const events: readonly RunEvent[] = [
      {
        type: "start_round",
        roundId: "round2",
        question,
        distributionVersion: 1,
      },
      { type: "choose_answer", answer: "no" },
      { type: "aim", percentage: 50 },
      { type: "lock" },
      { type: "launch" },
      { type: "reveal", distribution },
      { type: "resolve" },
    ];
    const cases: readonly [Run, readonly string[]][] = [
      [idle, ["start_round"]],
      [answering, ["choose_answer"]],
      [aiming, ["choose_answer", "aim"]],
      [locked, ["launch"]],
      [flight, ["reveal"]],
      [reveal, ["resolve"]],
      [resolved, ["start_round"]],
    ];
    for (const [state, allowed] of cases) {
      for (const event of events.filter(
        (candidate) => !allowed.includes(candidate.type)
      )) {
        expect(
          () => transitionRun(state, event),
          `${state.round.phase} -> ${event.type}`
        ).toThrow();
      }
    }
  });

  it("keeps locks and resolved snapshots immutable and independent of callers", () => {
    const mutableQuestion = { ...question };
    const answering = transitionRun(createRun("run1", "daily"), {
      type: "start_round",
      roundId: "round1",
      question: mutableQuestion,
      distributionVersion: 1,
    });
    mutableQuestion.distributionId = "changed";
    const aiming = transitionRun(answering, {
      type: "choose_answer",
      answer: "no",
    });
    const aimed = transitionRun(aiming, { type: "aim", percentage: 70 });
    const changedChoice = transitionRun(aimed, {
      type: "choose_answer",
      answer: "yes",
    });
    const locked = transitionRun(changedChoice, { type: "lock" });
    expect(locked.round).toMatchObject({
      lock: {
        question: { distributionId: "d1" },
        answer: "yes",
        guessPercentage: 70,
      },
    });
    if (locked.round.phase !== "locked")
      throw new Error("Expected locked round");
    const lock = locked.round.lock;
    expect(() => Object.assign(lock, { guessPercentage: 0 })).toThrow();
    expect(() =>
      Object.assign(lock.question, { distributionId: "changed" })
    ).toThrow();

    const mutableDistribution = { ...distribution };
    const reveal = transitionRun(transitionRun(locked, { type: "launch" }), {
      type: "reveal",
      distribution: mutableDistribution,
    });
    mutableDistribution.yesPercentage = 1;
    const resolved = transitionRun(reveal, { type: "resolve" });
    expect(resolved.completedRounds[0].distribution.yesPercentage).toBe(62.5);
    expect(() =>
      Object.assign(resolved.completedRounds[0].distribution, {
        yesPercentage: 1,
      })
    ).toThrow();
    expect(() =>
      Object.assign(resolved.completedRounds[0].score, { distance: 0 })
    ).toThrow();
    expect(() =>
      Object.assign(resolved.completedRounds, { 0: null })
    ).toThrow();
    expect(aimed.round).toMatchObject({ answer: "no", guessPercentage: 70 });
  });

  it("rejects invalid run and round identities and snapshot versions", () => {
    expect(() => createRun(" ", "daily")).toThrow();
    for (const changes of [
      { roundId: " " },
      { distributionVersion: 0 },
      { distributionVersion: 1.5 },
      { question: { ...question, prompt: "" } },
    ]) {
      expect(() =>
        transitionRun(createRun("run1", "daily"), {
          type: "start_round",
          roundId: "round1",
          question,
          distributionVersion: 1,
          ...changes,
        })
      ).toThrow();
    }
  });
});
