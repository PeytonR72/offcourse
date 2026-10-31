import { createHmac } from "node:crypto";
import {
  isInstallationId,
  isPlayPrediction,
  type PlayReply,
} from "../domain/server-play";
import type { PlayRepository } from "./play";

export const PLAY_HEADERS = { "cache-control": "no-store" };

export function playResponse(reply: PlayReply, code?: number): Response {
  const status =
    code ??
    {
      ok: 200,
      invalid: 400,
      conflict: 409,
      unavailable: 503,
      not_ready: 503,
      exhausted: 200,
      rate_limited: 429,
    }[reply.status];
  return Response.json(reply, {
    status,
    headers: {
      ...PLAY_HEADERS,
      ...(reply.status === "rate_limited" ? { "retry-after": "60" } : {}),
    },
  });
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readRequest(
  request: Request
): Promise<Record<string, unknown> | Response> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return playResponse({ status: "invalid" }, 403);
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return playResponse({ status: "invalid" }, 415);
  const reader = request.body?.getReader();
  if (!reader) return playResponse({ status: "invalid" });
  let bytes = 0;
  let text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) {
        await reader.cancel();
        return playResponse({ status: "invalid" }, 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    const body: unknown = JSON.parse(text + decoder.decode());
    if (!record(body) || !isInstallationId(body.installationId))
      return playResponse({ status: "invalid" });
    return body;
  } catch {
    return playResponse({ status: "invalid" });
  } finally {
    reader.releaseLock();
  }
}

export function createPlayHandlers({
  repository,
  secret,
  clock,
}: {
  repository: Pick<PlayRepository, "start" | "lock">;
  secret: string;
  clock: () => Date;
}) {
  const key = (id: unknown) =>
    createHmac("sha256", secret).update(String(id).toLowerCase()).digest("hex");
  async function execute(work: () => Promise<PlayReply>) {
    try {
      return playResponse(await work());
    } catch {
      console.error("Play database request unavailable");
      return playResponse({ status: "unavailable" });
    }
  }
  return {
    async start(request: Request): Promise<Response> {
      const body = await readRequest(request);
      if (body instanceof Response) return body;
      if (
        Object.keys(body).sort().join() !== "installationId,mode,requestId" ||
        !isInstallationId(body.requestId) ||
        (body.mode !== "daily" && body.mode !== "endless")
      )
        return playResponse({ status: "invalid" });
      const { requestId, mode } = body;
      return execute(() =>
        repository.start(
          key(body.installationId),
          requestId.toLowerCase(),
          mode,
          clock()
        )
      );
    },
    async lock(request: Request, runId: string): Promise<Response> {
      const body = await readRequest(request);
      if (body instanceof Response) return body;
      const installationId = body.installationId;
      if (
        !isInstallationId(runId) ||
        Object.keys(body).sort().join() !==
          "answer,guessPercentage,installationId,roundIndex" ||
        !isPlayPrediction(body)
      )
        return playResponse({ status: "invalid" });
      const prediction = {
        roundIndex: body.roundIndex,
        answer: body.answer,
        guessPercentage: body.guessPercentage,
      };
      return execute(() =>
        repository.lock(
          key(installationId),
          runId.toLowerCase(),
          prediction,
          clock()
        )
      );
    },
  };
}
