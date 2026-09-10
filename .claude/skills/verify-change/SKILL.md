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

For project paths, modules, and commands, read `reference.md` in this skill's directory.

## Dynamic Context

!`git diff --stat HEAD 2>/dev/null || true`

## Steps

1. Identify the smallest targeted check that proves the change.
2. Run it from the correct working directory.
3. If it fails:
   - Summarize with `file:line` references.
   - Propose the smallest next fix.
   - After 3 consecutive failures, stop. Recommend `/investigate-task`.
4. After targeted check passes, run broader checks:
   - Backend: targeted test → full tests → build → lint.
   - Frontend: build → lint.
5. Distinguish real services from mocks/test doubles.
6. Record each command, exit code, and important output lines.
7. Report what remains untested or risky.

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
