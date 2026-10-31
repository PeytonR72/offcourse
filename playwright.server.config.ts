import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "server-play.spec.ts",
  outputDir: "test-results/server-play",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/server-play", open: "never" }],
  ],
  use: { ...base.use, baseURL: "http://localhost:3101" },
  webServer: {
    command: "npm run start -- --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
    env: {
      PLAY_ENABLED: "true",
      PLAY_DATABASE_URL: process.env.PLAY_TEST_DATABASE_URL!,
      PLAY_SECRET: "isolated-test-fixture-secret-not-for-live-use",
    },
  },
});
