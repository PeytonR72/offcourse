# T16: Server-backed play manifests and anti-spoiler flow

Status: ready-for-agent
Blocked by: T15
Execution: Awaiting explicit user authorization; dependencies must be complete.

## What to build

Securely fetch question manifests without answer values before lock; server validates locked guess and returns official distribution version, tracks best-effort anonymous installation participation; fail safely on disconnect.

## Tests and acceptance

- [ ] endpoints don’t leak answers pre-lock; replay/idempotency; request throttling; server recomputes scores; frozen answer remains fixed mid-run; offline interruption handled.

## Delivery requirements

Follow the per-ticket red-green-refactor, verification, visual review, code review, commit, and push requirements in [the workflow](../../../docs/agents/workflow.md). Complete only this ticket and then wait.

## Evidence

Not started.
