import {
  isInstallationId,
  isPlayPrediction,
  type PlayPrediction,
} from "../../domain/server-play";
import type { RunMode } from "../../domain/scoring";

type SavedPrediction = { runId: string; prediction: PlayPrediction };
export type PlaySession = {
  installationId: string;
  requestId: string;
  draft?: SavedPrediction;
  pending?: SavedPrediction;
};
const sessionKey = (mode: RunMode) => `offcourse:server-play:v1:${mode}`;
function savedPrediction(value: unknown): value is SavedPrediction {
  if (
    typeof value !== "object" ||
    value === null ||
    !("runId" in value) ||
    !isInstallationId(value.runId) ||
    !("prediction" in value)
  )
    return false;
  return isPlayPrediction(value.prediction);
}
export function loadPlaySession(mode: RunMode): PlaySession {
  const identityKey = "offcourse:installation:v1";
  const savedId = localStorage.getItem(identityKey);
  const installationId = isInstallationId(savedId)
    ? savedId
    : crypto.randomUUID();
  localStorage.setItem(identityKey, installationId);
  let saved: unknown;
  try {
    saved = JSON.parse(localStorage.getItem(sessionKey(mode)) ?? "null");
  } catch {
    saved = null;
  }
  if (
    typeof saved === "object" &&
    saved !== null &&
    "requestId" in saved &&
    isInstallationId(saved.requestId) &&
    "installationId" in saved &&
    saved.installationId === installationId
  ) {
    return {
      installationId,
      requestId: saved.requestId,
      draft:
        "draft" in saved && savedPrediction(saved.draft)
          ? saved.draft
          : undefined,
      pending:
        "pending" in saved && savedPrediction(saved.pending)
          ? saved.pending
          : undefined,
    };
  }
  return { installationId, requestId: crypto.randomUUID() };
}
export function savePlaySession(mode: RunMode, session: PlaySession): void {
  localStorage.setItem(sessionKey(mode), JSON.stringify(session));
}
