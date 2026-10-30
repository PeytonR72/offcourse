# Offcourse

The official product and implementation plan is [docs/OFFCOURSE_SPEC.md](docs/OFFCOURSE_SPEC.md). The 18 scoped tickets are tracked locally under [.scratch/offcourse/issues/](.scratch/offcourse/issues/). Read [the execution workflow](docs/agents/workflow.md) before implementing a ticket.

Implementation is paused until the user says start or invokes `/implement ticket [n]`. This starter predates the spec; T01 will migrate it to the specified Next.js stack.

PixiJS starter using Vite and TypeScript.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The starter renders a rotating square; click it or use the Change color button to cycle colors. Reduced motion preferences disable rotation.

Edit `src/main.ts` to build your scene and `src/style.css` for the surrounding page. Put static assets in `public/` and load them using paths such as `/images/player.png`.

## Checks and production build

```sh
npm run typecheck
npm run build
npm run preview
```

The production output is written to `dist/`. Use a Node.js version supported by Vite (Node 22.12+ recommended).

PixiJS documentation: https://pixijs.com/8.x/guides/getting-started/quick-start
