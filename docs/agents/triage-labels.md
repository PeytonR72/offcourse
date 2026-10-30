# Triage labels

The user approved the default labels. Record them in the local ticket's `Status:` field; GitHub Issues is not the tracker.

| Role | Status | Meaning |
| --- | --- | --- |
| needs-triage | `needs-triage` | Needs evaluation |
| needs-info | `needs-info` | Waiting for information |
| ready-for-agent | `ready-for-agent` | Specified for agent implementation |
| ready-for-human | `ready-for-human` | Requires human implementation |
| wontfix | `wontfix` | Will not be actioned |

A ready status does not grant execution authorization or waive ticket dependencies. Follow `docs/agents/workflow.md` for the user's per-ticket execution gate. Completed tickets record their completion and validation evidence in the ticket file.
