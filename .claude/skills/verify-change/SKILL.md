---
name: verify-change
description: >
  Verify a fix, improvement, or refactor works AFTER implementation.
  Triggers: "verify", "check my change", "run checks", "does this work",
  "validate the fix", "before committing", "is it safe to merge".
  Produces executable evidence with pass/fail results.
argument-hint: "[describe what was changed]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(npm run test *)
  - Bash(npm run build *)
  - Bash(npx eslint *)
  - Bash(npx jest *)
---

# Verify Change

Produce executable evidence that a change works. Not a list of files touched — actual test results.

For project paths, modules, and commands, read `../reference.md`.

## Dynamic Context

!`git diff --stat HEAD 2>/dev/null || true`

## Steps

1. Identify the smallest targeted check that proves the changed behavior.
2. Run it from the correct working directory.
3. If it fails:
   - Summarize with `file:line` references.
   - Propose the smallest next fix.
   - After 3 consecutive failures, stop. Recommend `/investigate-task`.
4. Match checks to the behavior changed, not only to available unit tests:
   - Request/response wiring: run an HTTP check against the relevant endpoint and assert status plus response fields.
   - Persistence behavior: run a real-database check when the change affects stored data, transactions, migrations, or query behavior.
   - Browser interaction: run a browser check when the change affects UI controls, routing, rendering, or user input.
5. For cart quantity/stock changes specifically, demonstrate:
   - The API returns `stock` in cart item responses.
   - The browser caps quantity at the selected SKU stock.
   - The `+` control is disabled at the stock limit.
   - The limit updates when the selected SKU changes.
   - Keep focused unit evidence for service-level quantity validation.
6. After targeted checks pass, run broader checks:
   - Backend: targeted test → full tests → build → lint.
   - Frontend: build → lint.
7. Distinguish real services from mocks/test doubles.
8. Record each command, exit code, and important output lines.
9. Report what remains untested or risky.

## Rules

- Never weaken or delete tests to make verification pass.
- Never hide warnings or errors. Summarize and say whether they block.
- Targeted checks first, then broader.
- If a command mutates files, mention it. Prefer lint without `--fix`.
- Cite specific test names and `file:line` for failures.
- Stop after 3 consecutive failures.

## Output

```text
Verification target:

Commands run:
- command: ...
  directory: ...
  result: pass/fail
  evidence: file:line — detail

Behavior checks:
- unit/service: pass/fail — evidence
- HTTP/API: pass/fail/not applicable — evidence
- real database: pass/fail/not applicable — evidence
- browser/UI: pass/fail/not applicable — evidence

Mocks vs real services:
- ...

Result:
- pass/fail with summary

Limitations:
- what remains untested
- integration gaps

Recommended commit message:
...
```
