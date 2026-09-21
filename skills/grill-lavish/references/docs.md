# Documentation mode

Adapted from Matt Pocock's `domain-modeling` workflow.

Read CONTEXT-MAP.md first when present; it locates separate domain contexts.
Otherwise use root CONTEXT.md. Preserve existing structure and unrelated content.
Create files lazily when there is something substantive to record.

Challenge overloaded terms and contradictions with existing vocabulary. Use
concrete scenarios to make boundaries precise. Check claims against code and
distinguish current behavior from intended behavior.

When a term settles, update the relevant CONTEXT.md immediately. Keep it a domain
glossary, not a transcript, requirements list, or implementation plan:

```md
# Workspace

The shared environment in which members collaborate on a project.

## Language

**Reviewer**:
A member authorized to inspect a proposal and submit feedback.
_Avoid_: Approver (unless the member also has approval authority)
```

Record an ADR only for a decision that is costly to reverse, surprising without
context, and the result of a genuine trade-off. A request to document decisions
authorizes recording qualifying settled decisions; otherwise offer the ADR.

Use the relevant docs/adr directory, scan for the highest number, and increment
without overwriting. A title and one to three sentences covering context, choice,
and reason usually suffice. Never invent the user's rationale. Mark proposals
as proposed. Preserve rationale when superseding a decision and link its replacement.

Keep progress and unanswered questions in session state. Keep the final build
specification separate from the glossary and ADRs.
