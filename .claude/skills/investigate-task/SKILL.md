---
name: investigate-task
description: Investigate a bug report or small improvement before implementation. Use this when you need relevant files, current behavior, risks, and an implementation/test plan.
---

# Investigate Task

## Input

A bug report, proposed improvement, or small feature request. Include any known route, UI page, API endpoint, error message, or expected behavior.

## Steps

1. Restate the requested change and define the expected behavior.
2. Inspect the smallest relevant area of the repository first.
3. Identify the current implementation files, tests, DTOs, API clients, and UI callers involved.
4. Look for existing checks that can prove the current behavior.
5. If behavior is unclear, propose a minimal reproduction or controlled failing test.
6. Produce a scoped implementation plan and a validation plan.
7. Call out risks, assumptions, and rollback needs.

## Output

Return a concise investigation report with:

- Relevant files
- Current behavior
- Proposed change
- Test or check plan
- Risks and rollback notes
- Exact next command or invocation to continue

