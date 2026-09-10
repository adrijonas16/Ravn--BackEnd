---
name: docs-sync
description: >
  Check if documentation needs updates after a code change.
  Triggers: "update docs", "sync docs", "does the README match",
  "are the docs outdated", after merging a feature that changes
  API behavior, setup, or commands.
argument-hint: "[feature or file that changed]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# Docs Sync

Keep documentation aligned with implementation. Do not rewrite unrelated docs.

For project paths, modules, and commands, read `reference.md` in this skill's directory.

## Dynamic Context

!`git diff --name-only HEAD~3 2>/dev/null || true`

## Steps

1. Identify the changed behavior and files that implement it — cite `file:line`.
2. Search for related documentation in:
   - `README.md` (root)
   - `BackEnd/tshirt-store-api/**/README.md`
   - `BackEnd/tshirt-store-api/tshirt-api/docs/`
   - `docs/`
   - API examples, setup notes, environment guides.
3. Compare docs against implementation and tests.
4. Update only documentation directly affected.
5. If no docs need changes, say so and explain why.
6. Record docs that look outdated but are outside the current change.
7. Suggest a validation command when docs reference executable setup.

## Rules

- Do not invent behavior not present in code or tests.
- Do not rewrite broad documentation for a small code change.
- Keep docs short, specific, linked to actual commands or files.
- Do not include secrets, local tokens, or private environment values.
- Cite documentation locations as `file:line`.

## Output

```text
Changed behavior:
- file:line — description

Docs reviewed:
- file — relevant/not relevant

Docs updated:
- file:line — what changed and why

No-change rationale:
- file — why it does not need updating

Outdated docs outside scope:
- file:line — what looks wrong

Validation:
- command to verify documented behavior
```
