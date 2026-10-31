// @vitest-environment node
import { expect, test } from "vitest";
import { healthResponse } from "./health";

test("disabled server play reports a healthy demo without private data", async () => {
  const response = await healthResponse(false, null);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ status: "ok", play: "demo" });
});

test("requested server play fails closed on incomplete configuration", async () => {
  const missing = await healthResponse(true, null);
  expect(missing.status).toBe(503);
  expect(await missing.json()).toEqual({
    status: "degraded",
    play: "unavailable",
  });
});

test("requested server play signals insufficient qualified coverage", async () => {
  const waiting = await healthResponse(true, async () => false);
  expect(waiting.status).toBe(503);
  expect(waiting.headers.get("retry-after")).toBe("60");
  expect(await waiting.json()).toEqual({
    status: "degraded",
    play: "waiting_for_content",
  });
});

test("database failure reports unavailability without disclosing exception details", async () => {
  const unavailable = await healthResponse(true, async () => {
    throw new Error(
      "private database URL / unrevealed answer / participant key"
    );
  });
  expect(unavailable.status).toBe(503);
  expect(await unavailable.json()).toEqual({
    status: "degraded",
    play: "unavailable",
  });
});

test("qualified coverage reports ready without returning poll data", async () => {
  const ready = await healthResponse(true, async () => true);
  expect(ready.status).toBe(200);
  expect(await ready.json()).toEqual({ status: "ok", play: "ready" });
});
