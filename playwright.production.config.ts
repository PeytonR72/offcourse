import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

if (!process.env.SMOKE_BASE_URL)
  throw new Error("Set SMOKE_BASE_URL to the verified demo deployment origin");
const origin = new URL(process.env.SMOKE_BASE_URL).origin;

// These journeys use only the demo and fresh browser-local records.
export default defineConfig({
  ...base,
  testMatch: [
    "home.spec.ts",
    "launch.spec.ts",
    "daily.spec.ts",
    "endless.spec.ts",
    "polls.spec.ts",
  ],
  grep: /home page introduces|health reports|privacy stays|daily completes|10 survives|server-backed play stays/,
  retries: 0,
  use: { ...base.use, baseURL: origin },
  webServer: [],
});
