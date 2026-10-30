import { expect, test } from "@playwright/test";

test("poll intake stays disabled without approved backend configuration", async ({
  request,
}) => {
  const response = await request.post("/api/polls/tea/votes", {
    data: {
      installationId: "9c158c52-d7aa-4c80-88ee-f85fe1994b74",
      answer: "YES",
      consent: { accepted: true, version: "poll-v1" },
    },
  });
  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ status: "unavailable" });
  // There is no public answer-reading or editorial publishing endpoint.
  expect((await request.get("/api/polls/tea/votes")).status()).toBe(405);
  expect((await request.get("/api/polls/tea/distribution")).status()).toBe(404);
});
