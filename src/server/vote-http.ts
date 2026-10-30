import { createHmac } from "node:crypto";
import type { PollRepository, VoteStatus } from "./polls";

export const VOTE_HEADERS = { "cache-control": "no-store" };
const statuses: Record<VoteStatus, number> = {
  accepted: 201,
  duplicate: 409,
  invalid: 400,
  unavailable: 404,
  rate_limited: 429,
};

function reply(status: VoteStatus, code = statuses[status]): Response {
  return Response.json(
    { status },
    {
      status: code,
      headers: {
        ...VOTE_HEADERS,
        ...(status === "rate_limited" ? { "retry-after": "60" } : {}),
      },
    }
  );
}

async function readBody(
  request: Request
): Promise<{ body: unknown } | { response: Response }> {
  const reader = request.body?.getReader();
  if (!reader) return { response: reply("invalid") };
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
        return { response: reply("invalid", 413) };
      }
      text += decoder.decode(value, { stream: true });
    }
    return { body: JSON.parse(text + decoder.decode()) };
  } catch {
    return { response: reply("invalid") };
  } finally {
    reader.releaseLock();
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validVote(value: unknown): value is {
  installationId: string;
  answer: "YES" | "NO";
  consent: { accepted: true; version: "poll-v1" };
} {
  if (
    !record(value) ||
    Object.keys(value).sort().join() !== "answer,consent,installationId"
  )
    return false;
  const { installationId, answer, consent } = value;
  return (
    typeof installationId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      installationId
    ) &&
    (answer === "YES" || answer === "NO") &&
    record(consent) &&
    Object.keys(consent).sort().join() === "accepted,version" &&
    consent.accepted === true &&
    consent.version === "poll-v1"
  );
}

export function createVoteHandler({
  repository,
  secret,
  clock,
}: {
  repository: Pick<PollRepository, "vote">;
  secret: string;
  clock: () => Date;
}) {
  return async (request: Request, questionId: string): Promise<Response> => {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return reply("invalid", 403);
    if (
      request.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json"
    )
      return reply("invalid", 415);
    const parsed = await readBody(request);
    if ("response" in parsed) return parsed.response;
    const { body } = parsed;
    if (!validVote(body) || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(questionId)) {
      return reply("invalid");
    }
    const voterKey = createHmac("sha256", secret)
      .update(body.installationId.toLowerCase())
      .digest("hex");
    try {
      const status = await repository.vote(
        questionId,
        voterKey,
        body.answer,
        body.consent.version,
        clock()
      );
      return reply(status);
    } catch {
      return reply("unavailable", 503);
    }
  };
}
