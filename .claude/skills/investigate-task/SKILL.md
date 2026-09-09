---
name: investigate-task
description: Investigate a bug report or small improvement before implementation. Use this when you need relevant files, current behavior, risks, and an implementation/test plan.
---

# Investigate Task

Use this skill before writing code. The goal is to turn a vague request into a small, testable change with known files and known risks.

## Input

A bug report, proposed improvement, or small feature request. Include any known route, UI page, API endpoint, error message, or expected behavior.

Good inputs:

- "Investigate why cart quantity 0 reaches the service layer."
- "Investigate why the checkout page keeps showing a generic error."
- "Investigate whether product deletion updates the admin list correctly."

## Steps

1. Restate the requested change and define the expected behavior.
2. Inspect the smallest relevant area of the repository first.
3. Identify whether the change belongs to:
   - backend: `BackEnd/tshirt-store-api/tshirt-api`
   - frontend: `BackEnd/tshirt-store-api/tshirt-frontend`
   - both
4. Identify the current implementation files, tests, DTOs, API clients, and UI callers involved.
5. Look for existing checks that can prove the current behavior.
6. If behavior is unclear, propose a minimal reproduction or controlled failing test before implementation.
7. Produce a scoped implementation plan and a validation plan.
8. Call out risks, assumptions, and rollback needs.

## Working Directories

- Backend commands run from: `BackEnd/tshirt-store-api/tshirt-api`
- Frontend commands run from: `BackEnd/tshirt-store-api/tshirt-frontend`

Always `cd` to the correct directory before running any command.

## Repository Checks To Consider

- Backend focused test: `npm run test -- <spec-file> --runInBand`
- Backend full tests: `npm run test -- --runInBand`
- Backend build: `npm run build`
- Backend lint without auto-fix: `npx eslint "{src,apps,libs,test}/**/*.ts"`
- Frontend lint: `npm run lint`
- Frontend build: `npm run build`

Do not run broad checks first if a focused check can prove the behavior. Prefer the fastest useful feedback loop, then broaden after the fix.

## Output

Return a concise investigation report in this format:

```text
Task:
Expected behavior:

Relevant files:
- ...

Current behavior:
- ...

Proposed implementation:
- ...

Validation plan:
- Failing check or reproduction:
- Passing checks after fix:

Risks / assumptions:
- ...

Next command:
...
```
