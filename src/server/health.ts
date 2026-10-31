/** Public operational response: never include database details or poll answers. */
export async function healthResponse(
  requested: boolean,
  checkContent: (() => Promise<boolean>) | null
): Promise<Response> {
  let play = "demo";
  if (requested) {
    play = "unavailable";
    if (checkContent) {
      try {
        play = (await checkContent()) ? "ready" : "waiting_for_content";
      } catch {
        console.error("Play readiness check unavailable");
      }
    }
  }
  const ok = play === "demo" || play === "ready";
  return Response.json(
    { status: ok ? "ok" : "degraded", play },
    {
      status: ok ? 200 : 503,
      headers: {
        "cache-control": "no-store",
        ...(!ok ? { "retry-after": "60" } : {}),
      },
    }
  );
}
