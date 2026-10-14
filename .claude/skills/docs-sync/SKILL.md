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

For project paths, modules, and commands, read `../reference.md`.

## Dynamic Context

!`if [ -n "$TASK_BASE_SHA" ]; then echo "Task changes compared with TASK_BASE_SHA=$TASK_BASE_SHA..HEAD:"; git diff --name-only "$TASK_BASE_SHA" HEAD; else echo "Task changes baseline missing: set TASK_BASE_SHA to the selected PR base or merge-base SHA; do not treat missing output as no changes."; fi; echo "Staged changes compared with index:"; git diff --name-only --cached; echo "Unstaged changes compared with working tree:"; git diff --name-only`

## Steps

1. Select and state the baseline used for this task:
   - Prefer a PR base or merge-base SHA: `git diff --name-only <base-sha> HEAD`.
   - If reviewing docs history, find the last commit touching the actual relevant document path, for example `git log -1 --format=%H -- <doc-path>`, then inspect `git diff --name-only <docs-sha> HEAD`.
   - Include staged and unstaged changes separately when they are in scope.
   - If no baseline is available, report that explicitly; empty output must not imply no changes.
2. Identify the changed behavior and files that implement it — cite `file:line`.
3. Search for related documentation in:
   - `README.md` (root)
   - `BackEnd/tshirt-store-api/**/README.md`
   - `BackEnd/tshirt-store-api/tshirt-api/docs/`
   - `docs/`
   - API examples, setup notes, environment guides.
4. Treat a docs edit as a starting point for inspection, not proof everything was synchronized then.
5. Compare docs against implementation and tests.
6. Update only documentation directly affected.
7. If no docs need changes, say so and explain why.
8. Record docs that look outdated but are outside the current change.
9. Suggest a validation command when docs reference executable setup.

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

Baseline:
- comparison: <base-sha>..HEAD / <docs-sha>..HEAD / staged / unstaged
- changed files: ...
- missing baseline: yes/no — detail

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
