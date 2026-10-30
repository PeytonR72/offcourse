# Vercel project

- Dashboard: https://vercel.com/peytonr7272-gmailcoms-projects/offcourse
- Project: `offcourse` (`prj_EgeN02OuyS0QhVXZqLLy9sKk71mH`).
- Workspace: `peytonr7272-gmailcoms-projects` (`team_xhJ89qrqc3QBjcS7vn8veIcp`).
- Connected repository: `PeytonR72/offcourse` (private).
- Framework: Next.js, matching the app after the T01 migration.
- Node.js: 22.x, matching the local major version.
- Public source visibility: disabled.
- Deployment protection: Vercel authentication remains enabled for generated deployment URLs.

The local `.vercel/project.json` links this checkout to this exact project and is ignored by Git. Project and workspace IDs above are identifiers, not credentials. Future checkouts can recreate the link through `vercel link` after authenticating and verifying the intended workspace.

## Automatic deployments

The user authorized automatic deployments to test progress on a phone. Git deployments are enabled in `vercel.json` using `git.deploymentEnabled: true` (see [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)). Preview deployments are enabled, and the project's setup-only `exit 0` Ignored Build Step has been cleared.

Pushes to `main` deploy the current demo to the stable production URL; other branches receive preview URLs. Vercel authentication protects generated deployment URLs, so phone testing may require signing in to the user's Vercel account. Keep the private repository and deployment protection in place. This demo-testing authorization does not authorize real data sourcing, paid services, or claims of genuine crowd results.

No environment secrets or paid integrations were provisioned. Deployment and launch remain subject to the official specification and execution workflow.
