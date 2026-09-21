# Session contract

The session JSON is the design tree from `grilling`, kept as the agent's source
of truth. The review page is derived from it.

Top level: `schema_version: 2`, a stable `session_id`, positive integer
`revision` and `round`, `goal`, `summary`, `facts` (statement/source pairs),
`decisions`, and optional `discussion_only` (boolean). Set `discussion_only`
to `true` when the user asks for discussion only; a resumed session then keeps
project documents untouched without asking again.

Each decision has `id`, `question`, `why`, `depends_on` (IDs), `status`,
`options` (id/label/detail objects), `recommendation`, and `answer` (null or text).
Use ASCII letters, digits, hyphens, and underscores for IDs. Keep IDs stable.
Use an empty options array for open questions. Recommendations may be conditional
or explain why evidence is insufficient to recommend a choice.

Statuses:

- `open`: unresolved; on the frontier only when every dependency is resolved.
- `researching`: a running exploration for facts the agent must retrieve. Not a
  user question yet; only its descendants wait for it.
- `resolved`: requires a nonempty answer grounded in user input.
- `excluded`: requires a nonempty reason grounded in user-approved scope.
  Exclusion does not satisfy dependencies; revise or exclude descendants explicitly.

Dependencies must exist and form an acyclic graph. Resolved decisions cannot
depend on unresolved/excluded decisions. Invalidate affected descendants when
parent answers change. Validation catches structural errors; the agent owns
semantic relevance and truthful state changes.

The helper reports `draft`, `questions-ready`, `research-needed`, `blocked`, or
`ready-for-confirmation`. Empty drafts never count as complete. Readiness is a
structural check, not user approval.

Feedback carries session_id, revision, round, question_id, option_id, and notes.
An empty option_id with nonempty notes is a valid free-text answer. Match all
identifiers before applying it. Preserve stale input for visible reconciliation.
Record processed deliveries in a separate session log to prevent duplicate
application. Use transport IDs where available; otherwise fingerprint the full
delivery together with session and revision.

Increment revision on material changes. Save JSON and HTML with temp-file-plus-
rename writes. Keep session state and logs private by default.
