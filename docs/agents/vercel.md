# Vercel project

- Dashboard: https://vercel.com/peytonr7272-gmailcoms-projects/offcourse
- Project: `offcourse` (`prj_EgeN02OuyS0QhVXZqLLy9sKk71mH`).
- Workspace: `peytonr7272-gmailcoms-projects` (`team_xhJ89qrqc3QBjcS7vn8veIcp`).
- Connected repository: `PeytonR72/offcourse` (private).
- Framework: Next.js, configured for the planned T01 migration.
- Node.js: 22.x, matching the local major version.
- Public source visibility: disabled.
- Deployment protection: Vercel authentication remains enabled for generated deployment URLs.

The local `.vercel/project.json` links this checkout to this exact project and is ignored by Git. Project and workspace IDs above are identifiers, not credentials. Future checkouts can recreate the link through `vercel link` after authenticating and verifying the intended workspace.

## Deployment pause

The project was created without a deployment. Automatic Git deployments are disabled in `vercel.json` using `git.deploymentEnabled: false` (see [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)). The project also has preview deployments disabled and its Ignored Build Step set to `exit 0` to skip Git builds during setup.

Keep these settings until preview or release work is explicitly authorized. To enable Git deployments later, deliberately change the repository setting, remove the project's `exit 0` Ignored Build Step, and enable preview deployments as appropriate. Validate the Next.js migration and tests before deploying. Never interpret a ticket commit or push as permission for a public production launch.

No environment secrets or paid integrations were provisioned. Deployment and launch remain subject to the official specification and execution workflow.
