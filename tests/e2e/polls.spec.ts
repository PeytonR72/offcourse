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

test("server-backed play stays disabled and exposes no answer-reading route", async ({
  request,
  page,
}) => {
  const installationId = "9c158c52-d7aa-4c80-88ee-f85fe1994b74";
  for (const path of ["/api/play", `/api/play/${installationId}/lock`]) {
    const response = await request.post(path, { data: { installationId } });
    expect(response.status()).toBe(503);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(await response.json()).toEqual({ status: "unavailable" });
    expect((await request.get(path)).status()).toBe(405);
  }
  await page.goto("/play");
  await expect(page.getByRole("status")).toContainText(
    "Server-backed play is unavailable"
  );
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Offcourse · Demo practice" })
  ).toBeVisible();
});
