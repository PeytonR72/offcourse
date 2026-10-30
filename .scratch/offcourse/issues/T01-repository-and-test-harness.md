# T01: Repository and test harness

Status: ready-for-agent
Blocked by: none
Execution: Authorized by the user's `implement ticket 1` command on 2026-10-29.
Completion: Complete.

## What to build

Bootstrap Next.js, TS strict, Tailwind, Vitest, RTL, Playwright, CI and precommit checks; document commands.

## Tests and acceptance

- [x] initial smoke Playwright test red then green; page loads mobile + desktop; lint, typecheck, test, build work.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

- Migrated the Vite/Pixi rotating-square starter to Next.js App Router with
  strict TypeScript and Tailwind CSS. The static home page identifies the prototype
  and future simulated results; game mechanics and rendering remain in later tickets.
- Installed Vitest + RTL with jsdom, automatic cleanup, and jest-dom matchers.
  Browser tests are separate from unit/component test discovery.
- Added mobile (393 × 851, Pixel 7 emulation) and desktop (1440 × 900, Chromium)
  production-server smoke checks, screenshot capture, HTML reports, and failure traces.
- Added GitHub Actions for formatting, lint, typecheck, full Vitest suite, build,
  and mobile/desktop E2E; reports retained for 14 days. Husky runs staged formatting,
  lint, typecheck, and tests before commit. README documents setup and all commands.
- **Red:** `npx playwright test tests/e2e/home.spec.ts` failed on both viewports
  against the original starter: expected title `Offcourse`, received
  `Offcourse · PixiJS`. The original page also lacked the prototype disclosure.
- **Green:** `npm run test:e2e` passed both tests against `next build` + `next start`.
  Both returned HTTP 200, exposed the expected heading and disclosure, had no
  page errors, and fit the viewport without horizontal overflow.
- `npm ci` passed from the lockfile, installed Husky, and audited with zero
  vulnerabilities. TypeScript is on 6.0 and ESLint on 9 to satisfy the supported
  parser/plugin peer ranges on Node 22.14.0.
- `npm test -- src/app/page.test.tsx`, `npm test` (1 test), `npm run typecheck`,
  `npm run lint`, `npm run format:check`, and `npm run build` passed.
- Visually inspected saved screenshots: readable content, correct colors/Tailwind,
  no overlap or clipping, appropriate wrapping on both viewports.
  Evidence: [desktop](../../../docs/evidence/t01/desktop.png),
  [mobile](../../../docs/evidence/t01/mobile.png). These are emulated viewports,
  not physical-device or performance measurements.
- Review baseline: `f252d73600fd9185cffaab6169d882cf7fd97e1a`.
- Standards review: **0 findings**. No documented-standard violations or baseline
  code smells. Review additionally confirmed clean-clone typechecking without
  generated Next.js types and Husky's fail-fast hook launcher.
- Spec review: **0 findings**. T01 is fulfilled, including the harness, CI,
  precommit checks, and commands; no later-ticket implementation was introduced.
- Implementation commit: `e00e22e` — `T01: establish Next.js repository and test harness`,
  pushed normally to `origin/main` after the live precommit hook passed staged
  formatting, lint, typecheck, and tests.
- [Initial GitHub Actions run](https://github.com/PeytonR72/offcourse/actions/runs/40984801272)
  passed all checks on Ubuntu, including production mobile/desktop browser tests.
  Its deprecated action-runtime warning prompted a small follow-up using current
  `actions/checkout`, `actions/setup-node`, and `actions/upload-artifact` v7 releases.
- Automatic Vercel deployment pause remains intact. No deployment requested.
- Next unlocked ticket: **T02 — Domain types and rules**; awaits explicit authorization.
