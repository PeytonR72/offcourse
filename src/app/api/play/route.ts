import { getPlayRuntime } from "../../../server/play-runtime";
import { createPlayHandlers, playResponse } from "../../../server/play-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const play = getPlayRuntime();
  if (!play) return playResponse({ status: "unavailable" });
  return createPlayHandlers(play).start(request);
}
