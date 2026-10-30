# Offcourse

Before implementing any ticket, read `docs/OFFCOURSE_SPEC.md` in full and follow `docs/agents/workflow.md` for authorization, validation, review, commits, and pushes. Implement only the explicitly authorized ticket and stop afterward. Implementation is currently awaiting the user's start instruction.

## Agent skills

### Issue tracker

Use local Markdown tickets in `.scratch/offcourse/issues/`, preserving T01–T18 and their dependencies. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five triage labels as local ticket status values. See `docs/agents/triage-labels.md`.

### Domain docs

Use a single-context layout: root `GLOSSARY.md` and `docs/adr/`, created when needed. See `docs/agents/domain.md`.
