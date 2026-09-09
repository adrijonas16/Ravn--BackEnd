---
name: verify-change
description: Verify a code change with executable checks and summarize evidence. Use this after a fix or improvement to run targeted checks before broader build/test commands.
---

# Verify Change

## Input

A completed or proposed code change, plus any relevant bug reproduction, commit, branch, or files touched.

## Steps

1. Identify the smallest targeted check that should prove the change.
2. Run the targeted test, lint, typecheck, or build command.
3. If the targeted check fails, summarize the failure and suggest the next fix.
4. After the targeted check passes, run the broader relevant checks for the touched project area.
5. Distinguish real services from mocks or unit-test doubles.
6. Record command names and important output lines.
7. Report what remains untested or risky.

## Output

Return a verification report with:

- Commands run
- Passing/failing status
- Short evidence logs
- Mocked vs real services
- Remaining limitations
- Recommended commit message

