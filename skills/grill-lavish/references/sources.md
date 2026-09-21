# Upstream sources

Reviewed 2026-09-21. This independent integration is not an official release or
endorsement by either author.

- Matt Pocock, [skills](https://github.com/mattpocock/skills), commit
  `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`. MIT licensed. Four skills are
  copied verbatim into this repository's `skills/` directory: `grill-me`,
  `grilling`, `grill-with-docs`, and `domain-modeling` (with its
  `CONTEXT-FORMAT.md` and `ADR-FORMAT.md`).
- Kun Chen, [lavish-axi](https://github.com/kunchenguid/lavish-axi), commit
  `b4e82c63563cc9b4feaf947db53ec44902d10fb8`: README, the `lavish` skill,
  src/playbooks.js, and CLI poll guidance. MIT licensed. Lavish is an external
  runtime dependency and is not copied here; its skill defers to the installed CLI.

`grill-lavish` owns only the interview transport: session state, the review
page, and the poll loop. Questioning and documentation rules live in the
upstream skills and are loaded, not restated.

To refresh the copies, check out the newer upstream commit, copy the four skill
directories over `skills/<name>/`, confirm with `diff -r`, and update the commit
hash here and in THIRD-PARTY-NOTICES.md. Reconcile any change in the upstream
round format or ADR criteria with SKILL.md's "The page is the round" and
"Docs as you go" sections.

Source compatibility is not a claim of end-to-end testing on every harness or
Lavish npm version. Read installed runtime guidance before use.
