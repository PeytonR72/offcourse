import {
  validateDistribution,
  validateQuestion,
  type Distribution,
  type Question,
} from "./content";

export type QuestionSnapshot = Readonly<{
  question: Question;
  distribution: Distribution;
}>;

export type DemoCatalog = Readonly<{
  version: number;
  label: "Illustrative results";
  entries: readonly QuestionSnapshot[];
}>;

export type DailyDemoSelection = Readonly<{
  dateKey: string;
  catalogVersion: number;
  label: "Illustrative results";
}> &
  (
    | Readonly<{ status: "ready"; questions: readonly QuestionSnapshot[] }>
    | Readonly<{
        status: "unavailable";
        reason: "insufficient_questions";
        availableQuestionCount: number;
      }>
  );

export type EndlessDemoSelection = Readonly<{ label: "Illustrative results" }> &
  (
    | Readonly<{ status: "question"; entry: QuestionSnapshot }>
    | Readonly<{ status: "exhausted"; reason: "pool_exhausted" }>
  );

export function selectEndlessDemo(
  catalog: DemoCatalog,
  seenQuestionIds: readonly string[],
  random: () => number
): EndlessDemoSelection {
  const seen = new Set(seenQuestionIds);
  const remaining = demoPool(catalog).filter(
    ({ question }) => !seen.has(question.id)
  );
  if (!remaining.length) {
    return Object.freeze({
      label: "Illustrative results",
      status: "exhausted",
      reason: "pool_exhausted",
    });
  }
  const draw = random();
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1) {
    throw new Error(
      "Random draw must be between 0 (inclusive) and 1 (exclusive)"
    );
  }
  return Object.freeze({
    label: "Illustrative results",
    status: "question",
    entry: pinSnapshot(remaining[Math.floor(draw * remaining.length)]),
  });
}

export function selectDailyDemo(
  catalog: DemoCatalog,
  at: Date
): DailyDemoSelection {
  const dateKey = at.toISOString().slice(0, 10);
  const questions = demoPool(catalog);
  const metadata = {
    dateKey,
    catalogVersion: catalog.version,
    label: "Illustrative results" as const,
  };
  if (questions.length < 5) {
    return Object.freeze({
      ...metadata,
      status: "unavailable",
      reason: "insufficient_questions",
      availableQuestionCount: questions.length,
    });
  }
  const random = dailyRandom(`${dateKey}:${catalog.version}`);
  for (let index = questions.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [questions[index], questions[target]] = [
      questions[target],
      questions[index],
    ];
  }
  return Object.freeze({
    status: "ready",
    ...metadata,
    questions: Object.freeze(questions.slice(0, 5).map(pinSnapshot)),
  });
}

function pinSnapshot({
  question,
  distribution,
}: QuestionSnapshot): QuestionSnapshot {
  return Object.freeze({
    question: Object.freeze({ ...question }),
    distribution: Object.freeze({ ...distribution }),
  });
}

function demoPool(catalog: DemoCatalog): QuestionSnapshot[] {
  if (!Number.isSafeInteger(catalog.version) || catalog.version < 1) {
    throw new Error("Catalog version must be a positive integer");
  }
  const valid = catalog.entries.filter(isValidDemo);
  const questionCounts = new Map<string, number>();
  const distributionCounts = new Map<string, number>();
  for (const { question, distribution } of valid) {
    questionCounts.set(question.id, (questionCounts.get(question.id) ?? 0) + 1);
    distributionCounts.set(
      distribution.id,
      (distributionCounts.get(distribution.id) ?? 0) + 1
    );
  }
  // Ambiguous identities are excluded entirely rather than choosing a snapshot.
  return valid
    .filter(
      ({ question, distribution }) =>
        questionCounts.get(question.id) === 1 &&
        distributionCounts.get(distribution.id) === 1
    )
    .sort((a, b) =>
      a.question.id < b.question.id ? -1 : a.question.id > b.question.id ? 1 : 0
    );
}

function isValidDemo({ question, distribution }: QuestionSnapshot): boolean {
  try {
    validateQuestion(question);
    validateDistribution(distribution);
    return (
      question.status === "published" &&
      question.sourceType === "simulated" &&
      distribution.eligibilityStatus === "ineligible" &&
      distribution.sampleSize === 0 &&
      question.distributionId === distribution.id &&
      question.id === distribution.questionId
    );
  } catch {
    return false;
  }
}

function dailyRandom(seed: string): () => number {
  let state = 2166136261;
  for (const character of seed) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
