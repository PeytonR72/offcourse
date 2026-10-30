import { getPollIntake } from "../../../../../server/poll-runtime";
import {
  createVoteHandler,
  VOTE_HEADERS,
} from "../../../../../server/vote-http";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const intake = getPollIntake();
  if (!intake)
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: VOTE_HEADERS }
    );
  return createVoteHandler(intake)(request, (await params).questionId);
}
