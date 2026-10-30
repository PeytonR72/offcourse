# Offcourse execution workflow

## Authority and scope

Read `docs/OFFCOURSE_SPEC.md` in full before implementation. It is the official source for game rules, architecture, all 18 ticket scopes, and dependency edges.

Implementation is paused until the user says start or invokes `/implement ticket [n]`. An unqualified start authorizes T01 only. A ticket command authorizes only that ticket, subject to completed dependencies. Complete one ticket and wait for further instruction. Infrastructure setup and local ticket formalization do not complete T01.

Use the installed `setup-matt-pocock-skills`, `to-spec`, `to-tickets`, `tdd`, `implement`, and `code-review` skills as applicable. Preserve the existing 18 tickets when formalizing them.

## Validation and delivery

For each authorized ticket, demonstrate a meaningful failing test, implement the passing behavior, and refactor. Run the targeted and full relevant tests, typecheck, lint, build, and relevant Playwright smoke checks. Review visual changes on mobile and desktop and retain evidence. Complete code review before committing.

The user explicitly authorized automatic commits and pushes of completed tickets to the private GitHub repository at `https://github.com/PeytonR72/offcourse`. Use a normal commit containing the ticket ID and evidence, then push to the current branch. Inspect the diff and staged file list first; keep secrets, local environment files, build output, and dependencies out of commits. Preserve unrelated work and avoid force pushes.

After each ticket, report what works, commands and results, visual evidence where relevant, commit/push status, and the next unlocked ticket. Stop after the requested ticket.

Ask before adding unplanned features, live data sources, or paid services. Vercel project linking is authorized; a public production launch remains gated by the specification and explicit release approval. Keep automatic deployments paused during the initial setup.

## Repository setup

GitHub hosts the private repository; local Markdown is the issue tracker. See `docs/agents/issue-tracker.md`.

The existing PixiJS/Vite starter predates the product specification. T01 is responsible for migrating to Next.js and establishing the full test harness; no game ticket is complete yet.

The Vercel connection requires workspace authorization before the project can be created. Complete the intended `offcourse` project setup in the user's existing Hobby workspace after access is approved; use Next.js configuration, private source visibility, and paused automatic deployments.
