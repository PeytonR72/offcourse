import type { Question } from "./content";
import type { ResolvedRound, PersonalAnswer } from "./run";
import type { RunMode } from "./scoring";

/** Deliberately contains no distribution values. Results appear only after lock. */
export type PlayManifest = Readonly<{
  id: string;
  mode: RunMode;
  dateKey: string;
  questions: readonly { question: Question; distributionVersion: number }[];
  results: readonly ResolvedRound[];
  status: "active" | "complete" | "lost" | "exhausted";
  totalDistance: number;
  streak: number;
}>;

export type PlayReply =
  | { status: "ok"; play: PlayManifest }
  | { status: "conflict"; play: PlayManifest }
  | { status: "invalid" | "unavailable" | "conflict" | "rate_limited" };

export type PlayPrediction = Readonly<{
  roundIndex: number;
  answer: PersonalAnswer;
  guessPercentage: number;
}>;

const installationPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isInstallationId(value: unknown): value is string {
  return typeof value === "string" && installationPattern.test(value);
}

export function isPlayPrediction(value: unknown): value is PlayPrediction {
  if (typeof value !== "object" || value === null) return false;
  return (
    "roundIndex" in value &&
    Number.isSafeInteger(value.roundIndex) &&
    Number(value.roundIndex) >= 0 &&
    "answer" in value &&
    (value.answer === "yes" || value.answer === "no") &&
    "guessPercentage" in value &&
    Number.isInteger(value.guessPercentage) &&
    Number(value.guessPercentage) >= 0 &&
    Number(value.guessPercentage) <= 100
  );
}
