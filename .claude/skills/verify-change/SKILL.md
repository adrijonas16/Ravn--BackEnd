---
name: verify-change
description: Verify a code change with executable checks and summarize evidence. Use this after a fix or improvement to run targeted checks before broader build/test commands.
---

# Verify Change

Use this skill after an implementation or when reviewing a branch. The goal is to produce evidence that the change works, not just a summary of files touched.

## Input

A completed or proposed code change, plus any relevant bug reproduction, commit, branch, or files touched.

Good inputs:

- "Verify the cart quantity validation fix."
- "Verify this PR only changes backend behavior and all related checks pass."
- "Verify this frontend change builds and lint passes."

## Steps

1. Identify the smallest targeted check that should prove the change.
2. Run the targeted test, lint, typecheck, or build command from the correct project directory.
3. If the targeted check fails, summarize the failure and stop with the smallest next fix.
4. After the targeted check passes, run broader checks for the touched project area.
5. If backend files changed, consider:
   - `npm run test -- <spec-file> --runInBand`
   - `npm run test -- --runInBand`
   - `npm run build`
   - `npx eslint "{src,apps,libs,test}/**/*.ts"`
6. If frontend files changed, consider:
   - `npm run lint`
   - `npm run build`
7. Distinguish real services from mocks or unit-test doubles.
8. Record command names and important output lines.
9. Report what remains untested or risky.

## Rules

- Do not weaken or delete tests to make verification pass.
- Do not hide warnings or errors. Summarize them and say whether they block the change.
- Prefer targeted checks first, then broader checks.
- If a command mutates files, mention it. For backend lint, prefer direct ESLint without `--fix` when verifying.

## Output

Return a verification report in this format:

```text
Verification target:

Commands run:
- command: ...
  result: pass/fail
  evidence: ...

Mocks vs real services:
- ...

Result:
- ...

Limitations:
- ...

Recommended commit message:
...
```
