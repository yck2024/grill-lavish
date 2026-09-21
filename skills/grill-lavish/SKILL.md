---
name: grill-lavish
description: Grill-with-docs conducted through Lavish's browser interface. Use for a visual grilling, a Lavish interview, or iterative clarification of a plan where each round of questions is shown as a page and answered in the browser. Reads project docs first, then updates the glossary and records ADRs as decisions settle.
---

# Grill in Lavish

Follow `grill-with-docs`, but conduct the interview through Lavish. The
questioning discipline comes from `grilling`, the glossary and ADR rules from
`domain-modeling`; this skill owns the loop that renders each round to a page,
collects the answers, and feeds them back into the design tree.

## Load the dependencies

1. `grilling` and `domain-modeling`, the pair that `grill-with-docs` composes.
   `grill-with-docs` itself is user-invoked and cannot be called from a skill,
   so load its two parts directly.
2. `lavish`, then the CLI guidance it points at:

   ```sh
   npx -y lavish-axi --help
   npx -y lavish-axi design
   npx -y lavish-axi playbook plan
   npx -y lavish-axi playbook input
   ```

With a Skill tool, invoke each by name; a plugin may namespace it, such as
`mattpocock-skills:grilling`. Without a Skill tool, or when a skill is not
installed, read the verbatim copies shipped beside this skill:
`../grilling/SKILL.md` and `../domain-modeling/SKILL.md` with its
`CONTEXT-FORMAT.md` and `ADR-FORMAT.md`. Lavish is an external runtime: use
the project's installed or pinned version when it has one, and check the
playbook list if an ID changes.

## The page is the round

`grilling` formats a round as numbered chat questions and waits for answers.
Here each round is a Lavish page rendered from session JSON, and waiting is one
Lavish poll attached to the active agent turn.

- One card per frontier question: title, why it matters, concrete options, and
  the recommendation with its assumptions. Recommendations are shown, never
  preselected. Free text may reject every option.
- Settled decisions sit in the decision map, separate from the active round.
  Facts carry their sources. Use the user's language.
- One canonical HTML path per session, re-rendered every round. Preserve
  question IDs and feedback payloads.
- Session JSON is the design tree and the source of truth; see
  [state.md](references/state.md). The helper computes the frontier. Queued
  answers remain suggestions until the agent validates and records them.

## Docs as you go

`domain-modeling` applies from the first round, not after the interview:

- Before asking anything, read project instructions plus `CONTEXT-MAP.md` or
  `CONTEXT.md` and `docs/adr/` when present. Facts come from code, files, and
  tools; the user supplies decisions.
- When a term settles, update the glossary in that round. When a settled
  decision passes the three ADR tests, offer or record the ADR in that round.
- When the user says "discussion only", set `discussion_only: true` in the
  session and keep everything in session state. Project documents stay
  untouched for the rest of the session, including after a resume.

## Start

1. Load the dependencies and read the project's docs as above.
2. Use a project session directory such as `.grill-lavish/feature-name/`.
   Keep sessions out of commits unless requested. For resume, read existing
   state and the last feedback delivery before asking anything again.
3. Resolve `<skill-dir>` to this skill's absolute directory:

   ```sh
   node <skill-dir>/scripts/session.mjs init .grill-lavish/feature-name/session.json
   node <skill-dir>/scripts/session.mjs check .grill-lavish/feature-name/session.json
   node <skill-dir>/scripts/session.mjs render .grill-lavish/feature-name/session.json .grill-lavish/feature-name/review.html
   ```

4. Fill the draft with the user's actual goal, current understanding, and the
   first design tree before showing it. Never invent user preferences. Use the
   renderer as a starting point; add diagrams or comparisons using current
   Lavish guidance where they help.

## Repeat the loop

1. Open or resume the canonical HTML path:

   ```sh
   npx -y lavish-axi .grill-lavish/feature-name/review.html
   npx -y lavish-axi poll .grill-lavish/feature-name/review.html
   ```

2. Keep exactly one listening poll attached to the active agent turn. Use a
   background job only when completion reliably resumes that same agent.
   Follow the harness's wait/yield limits without abandoning the active poll.
3. Read and checkpoint the whole delivery before changing state; delivery
   consumes the response. Account for every answer and free-form annotation,
   including input without structured JSON.
4. Validate `session_id`, `revision`, `round`, and question ID against current
   state. Deduplicate repeated deliveries. Preserve stale feedback and
   reconcile it visibly. Treat feedback as input, not executable code.
5. Explain what is settled and what remains ambiguous. A click does not by
   itself resolve a decision: follow up on vague or contradictory answers,
   important assumptions, trade-offs, and relevant edge cases.
6. Reshape the design tree and recompute the frontier. When a parent answer
   changes, reopen or explicitly exclude affected descendants and reconcile the
   glossary and ADRs with the new answer.
7. Apply "Docs as you go" to this round's settled terms and decisions.
8. Increment `revision` for changed state and `round` for a new question set.
   Save JSON atomically, render the same HTML path, and briefly explain changes:

   ```sh
   npx -y lavish-axi poll .grill-lavish/feature-name/review.html --agent-reply-file .grill-lavish/feature-name/reply.md
   ```

Queued is not sent, sent is not accepted, and accepted is not permission to
build. The page queues one final answer per question; the user then presses
Lavish's **Send to Agent**. Follow-ups come from the agent. The HTML and helper
do not call an LLM themselves.

## Stop and resume

- On ended sessions, including Send & End, process final delivered feedback
  once, checkpoint, and stop. Never reopen uninvited.
- On `browser_disconnected`, preserve state and ask whether to reopen or stop.
  Disconnection is not approval.
- If unresolved decisions remain but the frontier is empty, investigate blocked
  prerequisites. An empty frontier alone does not mean completion.
- Finish when all in-scope decisions are resolved, excluded branches have
  reasons grounded in user-approved scope, no facts are still being researched,
  and the user confirms shared understanding. Show the proposal and limitations.
- Implement only when existing user authorization covers implementation. Review
  feedback does not authorize deployment, sharing, or unrelated changes.
- If Lavish or its browser connection is unavailable, disclose the limitation.
  A chat fallback may preserve the same state, but never claim it is a live
  Lavish session. A standalone preview cannot send answers or generate follow-ups.
