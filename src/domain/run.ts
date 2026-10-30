import {
  validateDistribution,
  validateQuestion,
  type Distribution,
  type Question,
} from "./content";

export type RunMode = "daily" | "endless";
export type PersonalAnswer = "yes" | "no";

type RoundContext = Readonly<{
  roundId: string;
  question: Question;
  distributionVersion: number;
}>;

export type LockedAnswer = RoundContext &
  Readonly<{
    answer: PersonalAnswer;
    guessPercentage: number;
  }>;

/** The one resolution record that scoring can consume in T03. */
export type ResolvedRound = Readonly<{
  lock: LockedAnswer;
  distribution: Distribution;
}>;

export type RoundState =
  | Readonly<{ phase: "idle" }>
  | (RoundContext & Readonly<{ phase: "answering" }>)
  | (RoundContext &
      Readonly<{
        phase: "aiming";
        answer: PersonalAnswer;
        guessPercentage: number | null;
      }>)
  | Readonly<{ phase: "locked" | "flight"; lock: LockedAnswer }>
  | Readonly<{ phase: "reveal" | "resolved"; result: ResolvedRound }>;

export type Run = Readonly<{
  id: string;
  mode: RunMode;
  round: RoundState;
  completedRounds: readonly ResolvedRound[];
}>;

export type RunEvent =
  | (RoundContext & Readonly<{ type: "start_round" }>)
  | Readonly<{ type: "choose_answer"; answer: PersonalAnswer }>
  | Readonly<{ type: "aim"; percentage: number }>
  | Readonly<{ type: "lock" | "launch" | "resolve" }>
  | Readonly<{ type: "reveal"; distribution: Distribution }>;

export function createRun(id: string, mode: RunMode): Run {
  if (!id.trim() || !["daily", "endless"].includes(mode)) {
    throw new Error("Invalid run identity or mode");
  }
  return Object.freeze({
    id,
    mode,
    round: Object.freeze({ phase: "idle" }),
    completedRounds: Object.freeze([]),
  });
}

export function transitionRun(run: Run, event: RunEvent): Run {
  const round = run.round;
  switch (event.type) {
    case "start_round": {
      if (round.phase !== "idle" && round.phase !== "resolved") break;
      if (
        run.completedRounds.some(
          (result) => result.lock.roundId === event.roundId
        )
      ) {
        throw new Error("Round has already been resolved");
      }
      validateQuestion(event.question);
      if (
        !event.roundId.trim() ||
        !Number.isSafeInteger(event.distributionVersion) ||
        event.distributionVersion < 1
      ) {
        throw new Error("Invalid round identity or distribution version");
      }
      return withRound(run, {
        phase: "answering",
        roundId: event.roundId,
        question: Object.freeze({ ...event.question }),
        distributionVersion: event.distributionVersion,
      });
    }
    case "choose_answer":
      if (round.phase !== "answering" && round.phase !== "aiming") break;
      if (event.answer !== "yes" && event.answer !== "no") {
        throw new Error("Personal answer must be yes or no");
      }
      return withRound(run, {
        ...round,
        phase: "aiming",
        answer: event.answer,
        guessPercentage:
          round.phase === "aiming" ? round.guessPercentage : null,
      });
    case "aim":
      if (round.phase !== "aiming") break;
      if (
        !Number.isInteger(event.percentage) ||
        event.percentage < 0 ||
        event.percentage > 100
      ) {
        throw new Error("Guess must be an integer between 0 and 100");
      }
      return withRound(run, { ...round, guessPercentage: event.percentage });
    case "lock":
      if (round.phase !== "aiming" || round.guessPercentage === null) break;
      return withRound(run, {
        phase: "locked",
        lock: Object.freeze({
          roundId: round.roundId,
          question: round.question,
          distributionVersion: round.distributionVersion,
          answer: round.answer,
          guessPercentage: round.guessPercentage,
        }),
      });
    case "launch":
      if (round.phase !== "locked") break;
      return withRound(run, { phase: "flight", lock: round.lock });
    case "reveal":
      if (round.phase !== "flight") break;
      validateDistribution(event.distribution);
      if (
        event.distribution.id !== round.lock.question.distributionId ||
        event.distribution.questionId !== round.lock.question.id ||
        event.distribution.version !== round.lock.distributionVersion
      ) {
        throw new Error(
          "Reveal must match the pinned distribution and question"
        );
      }
      return withRound(run, {
        phase: "reveal",
        result: Object.freeze({
          lock: round.lock,
          distribution: Object.freeze({ ...event.distribution }),
        }),
      });
    case "resolve":
      if (round.phase !== "reveal") break;
      return withRound(
        {
          ...run,
          completedRounds: Object.freeze([
            ...run.completedRounds,
            round.result,
          ]),
        },
        { phase: "resolved", result: round.result }
      );
  }
  throw new Error(`Cannot ${event.type} during ${round.phase}`);
}

function withRound(run: Run, round: RoundState): Run {
  return Object.freeze({ ...run, round: Object.freeze(round) });
}
