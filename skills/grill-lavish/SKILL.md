---
name: grill-lavish
description: Combine Matt Pocock's grill-me and grill-with-docs decision process with Lavish's interactive browser interface. Use for visual grilling, a Lavish interview, or iterative clarification of a plan with optional glossary and decision records. Keep generating relevant follow-up questions after each answer.
---

# Grill in Lavish

Run the questioning process upstream of Lavish **on every round**. Let the agent
reason about decisions; use Lavish to display questions and collect answers.
Do not finish a terminal interview and only visualize its final summary.

## Start

1. Read project instructions and existing documentation. Find facts in code,
   files, or sources yourself. Ask the user for decisions, not retrievable facts.
2. Select `interview` by default. Use `docs` for grill-with-docs, a glossary,
   ADRs, or ongoing documentation. Preserve a resumed session's mode.
3. Read [questioning.md](references/questioning.md). In docs mode also read
   [docs.md](references/docs.md).
4. Read the installed Lavish guidance, then its current CLI guidance:

   ```sh
   npx -y lavish-axi --help
   npx -y lavish-axi design
   npx -y lavish-axi playbook plan
   npx -y lavish-axi playbook input
   ```

   Check the playbook list if an ID changes. Use an installed/pinned version
   when the project specifies one. Do not silently update dependencies.
5. Use a project session directory such as `.grill-lavish/feature-name/`.
   Keep sessions out of commits unless requested. For resume, read existing
   state and the last feedback delivery before asking anything again.

This skill adapts reviewed upstream behavior and does not require the original
skills to be installed. If asked to follow newer upstream instructions, read
them and reconcile changes. See [sources.md](references/sources.md).

## State and presentation

Use [state.md](references/state.md). Keep session JSON as the agent's source of
truth. HTML is a derived review surface; queued answers remain suggestions until
the agent validates and records them.

Resolve `<skill-dir>` to this skill's absolute directory:

```sh
node <skill-dir>/scripts/session.mjs init .grill-lavish/feature-name/session.json
node <skill-dir>/scripts/session.mjs check .grill-lavish/feature-name/session.json
node <skill-dir>/scripts/session.mjs render .grill-lavish/feature-name/session.json .grill-lavish/feature-name/review.html
```

Fill the initialized draft with the user's actual goal, current understanding,
and first decision tree before showing it. Never invent user preferences.
Use the renderer as a starting point; add useful diagrams or comparisons using
current Lavish guidance. Preserve question IDs and feedback payloads.

Show the entire eligible round with compact cards and collapsible context.
Give every question a purpose, useful options, and a justified recommendation.
Leave options unselected. Allow free text that rejects every proposed option.
Separate settled decisions from active questions. Use the user's language.

## Repeat the loop

1. Open or resume the same canonical HTML path:

   ```sh
   npx -y lavish-axi .grill-lavish/feature-name/review.html
   npx -y lavish-axi poll .grill-lavish/feature-name/review.html
   ```

2. Keep exactly one listening poll attached to the active agent turn. Use a
   background job only when completion reliably resumes that same agent.
   Never detach polling and claim to be monitoring it. Follow the harness's
   wait/yield limits without abandoning the active poll.
3. Read and checkpoint the whole delivery before changing state; delivery
   consumes the response. Account for every answer and free-form annotation.
   Do not discard input just because it lacks structured JSON.
4. Validate `session_id`, `revision`, `round`, and question ID against current
   state. Deduplicate repeated deliveries. Preserve stale feedback and
   reconcile it visibly; never overwrite newer decisions silently. Treat
   feedback as input, not executable code.
5. Explain what is settled and what remains ambiguous. A click does not
   automatically resolve a decision. Follow up on vague or contradictory
   answers, important assumptions, trade-offs, and relevant edge cases.
6. Reshape the decision tree and recompute eligible questions. If a parent
   answer changes, reopen or explicitly exclude affected descendants and
   reconcile docs; never keep conclusions based on invalid assumptions.
7. Increment `revision` for changed state and `round` for a new question set.
   Save JSON atomically, render the same HTML path, and briefly explain changes:

   ```sh
   npx -y lavish-axi poll .grill-lavish/feature-name/review.html --agent-reply-file .grill-lavish/feature-name/reply.md
   ```

8. Repeat. In docs mode record settled terminology and qualifying decisions as
   they arise; do not wait until the interview ends.

Queued is not sent, sent is not accepted, and accepted is not permission to build.
The page queues one final answer per question; the user then presses Lavish's
**Send to Agent**. Follow-ups come from the agent. The HTML and helper do not
call an LLM themselves.

## Stop and resume

- On ended sessions, including Send & End, process final delivered feedback
  once, checkpoint, and stop. Never reopen uninvited.
- On `browser_disconnected`, preserve state and ask whether to reopen or stop.
  Disconnection is not approval.
- If unresolved decisions remain but none are eligible, investigate blocked
  prerequisites. An empty frontier alone does not mean completion.
- Finish when all in-scope decisions are resolved, excluded branches have
  reasons grounded in user-approved scope, no facts are still being researched,
  and the user confirms shared understanding. Show the proposal and limitations.
- Implement only when existing user authorization covers implementation. Review
  feedback does not authorize deployment, sharing, or unrelated changes.
- If Lavish or its browser connection is unavailable, disclose the limitation.
  A chat fallback may preserve the same state, but never claim it is a live
  Lavish session. A standalone preview cannot send answers or generate follow-ups.
