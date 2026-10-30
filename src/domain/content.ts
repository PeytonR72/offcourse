export type Question = Readonly<{
  id: string;
  prompt: string;
  yesLabel: string;
  noLabel: string;
  category: string;
  status: "draft" | "published" | "retired";
  sourceType: "simulated" | "first_party" | "licensed_external";
  distributionId: string;
}>;

export type Distribution = Readonly<{
  id: string;
  questionId: string;
  yesPercentage: number;
  sampleSize: number;
  frozenAt: string;
  sourceAttribution?: string;
  eligibilityStatus: "ineligible" | "eligible";
  version: number;
}>;

export function validateQuestion(question: Question): void {
  for (const field of [
    "id",
    "prompt",
    "yesLabel",
    "noLabel",
    "category",
    "distributionId",
  ] as const) {
    requireText(question[field], field);
  }
  if (!["draft", "published", "retired"].includes(question.status)) {
    throw new Error("Invalid question status");
  }
  if (
    !["simulated", "first_party", "licensed_external"].includes(
      question.sourceType
    )
  ) {
    throw new Error("Invalid question source type");
  }
}

export function validateDistribution(distribution: Distribution): void {
  requireText(distribution.id, "distribution id");
  requireText(distribution.questionId, "question id");
  if (
    !Number.isFinite(distribution.yesPercentage) ||
    distribution.yesPercentage < 0 ||
    distribution.yesPercentage > 100
  ) {
    throw new Error("Crowd percentage must be between 0 and 100");
  }
  if (
    !Number.isSafeInteger(distribution.sampleSize) ||
    distribution.sampleSize < 0
  ) {
    throw new Error("Sample size must be a nonnegative integer");
  }
  if (!Number.isSafeInteger(distribution.version) || distribution.version < 1) {
    throw new Error("Distribution version must be a positive integer");
  }
  if (
    typeof distribution.frozenAt !== "string" ||
    !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(distribution.frozenAt) ||
    !Number.isFinite(Date.parse(distribution.frozenAt))
  ) {
    throw new Error(
      "Frozen time must include a valid date, time, and timezone"
    );
  }
  if (distribution.sourceAttribution !== undefined) {
    requireText(distribution.sourceAttribution, "source attribution");
  }
  if (!["ineligible", "eligible"].includes(distribution.eligibilityStatus)) {
    throw new Error("Invalid eligibility status");
  }
}

function requireText(value: string, field: string): void {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be nonempty text`);
  }
}
