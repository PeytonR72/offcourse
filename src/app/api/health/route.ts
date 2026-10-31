import { getPlayRuntime } from "../../../server/play-runtime";
import { healthResponse } from "../../../server/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const play = getPlayRuntime();
  return healthResponse(
    process.env.PLAY_ENABLED === "true",
    play?.checkContent ?? null
  );
}
