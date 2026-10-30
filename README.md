# Offcourse

Guess what humanity thinks to steer a tiny rocket through space.

T01 establishes the Next.js App Router, strict TypeScript, Tailwind CSS, and test
harness. The home page is a prototype shell; gameplay starts in later tickets.
Prototype results will be simulated and clearly labeled **Illustrative results**.

The official plan is [docs/OFFCOURSE_SPEC.md](docs/OFFCOURSE_SPEC.md). The 18
tickets live in [.scratch/offcourse/issues/](.scratch/offcourse/issues/).
Follow [the workflow](docs/agents/workflow.md); each ticket needs explicit user
authorization. Automatic Vercel deployments remain paused.

## Setup and local development

Use Node.js **22.14.0 or newer within 22.x** and npm. CI uses Node 22.14.0.
No environment variables or external services are required for T01.

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open <http://localhost:3000>. Edit `src/app/page.tsx` for the home page,
`src/app/layout.tsx` for metadata and the document, and `src/app/globals.css`
for global styles. Tailwind utility classes are available in TSX files.

## Checks

| Command                             | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `npm run lint`                      | Next.js, accessibility, and TypeScript ESLint rules       |
| `npm run typecheck`                 | Strict TypeScript check without emitting files            |
| `npm test`                          | Full Vitest + React Testing Library suite, once           |
| `npm run test:watch`                | Vitest watch mode                                         |
| `npm test -- src/app/page.test.tsx` | One test file                                             |
| `npm run format:check`              | Verify formatting of maintained application/tooling files |
| `npm run format`                    | Format those files                                        |
| `npm run build`                     | Build the production Next.js app into `.next/`            |
| `npm start`                         | Serve the existing production build on port 3000          |
| `npm run test:e2e`                  | Production smoke tests on desktop and mobile Chromium     |

Build **before** running E2E tests. Playwright starts and stops its own production
server on port 3100; leave that port free. The suite checks the HTTP response,
page title, accessible content, honest prototype labeling, browser errors, and
horizontal overflow. It saves a full-page screenshot per viewport in
`test-results/`, an HTML report in `playwright-report/`, and traces on failure.
Open the report with `npx playwright show-report`.

Run the same checks as CI:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

On Linux, use `npx playwright install --with-deps chromium` to install browser
system libraries too. CI uploads reports, screenshots, and failure traces for
14 days. Chromium device emulation checks layout; it does not replace testing
on real phones or other browser engines in later tickets.

## Tests and commits

Vitest discovers `src/**/*.test.ts` and `src/**/*.test.tsx`; browser tests live
separately under `tests/e2e/`. RTL uses jsdom, jest-dom matchers, and cleanup after
each test via `tests/setup.ts`. Test observable behavior through public interfaces.

`npm ci` installs the Husky hook through `prepare`. Before a commit, lint-staged
formats staged files, then the hook runs lint, typecheck, and the full Vitest suite.
Production build and browser tests run in CI. Keep generated output, dependencies,
local environment files, and `.vercel/` out of commits.

TypeScript stays on the 6.0 line and ESLint on 9 to match the parser and plugins
used by `eslint-config-next`. Vite is used only by the Vitest harness; the app
is built and served by Next.js. Pixi world rendering belongs to T06.

T01 verification and retained screenshots are recorded in
[its ticket](.scratch/offcourse/issues/T01-repository-and-test-harness.md).
