import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// jsdom has no viewport observer. Visual motion is exercised in Playwright.
class TestIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "IntersectionObserver", {
  value: TestIntersectionObserver,
  configurable: true,
});
