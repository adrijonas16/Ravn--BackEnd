---
name: investigate-task
description: >
  Investigate a bug, unexpected behavior, or small improvement BEFORE writing code.
  Triggers: error trace, stack trace, "why does X happen", "investigate", "look into",
  "before I change X", route/endpoint/page debugging, "it used to work".
  Produces a scoped plan with relevant files, risks, and validation steps.
argument-hint: "[describe the bug or behavior]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Agent
  - Bash(git log *)
  - Bash(git diff *)
  - Bash(git show *)
---

# Investigate Task

Turn a vague report into a scoped, testable change with known files, known risks, and a clear hypothesis. Do NOT write code.

For project paths, modules, and commands, read `reference.md` in this skill's directory.

## Dynamic Context

!`git diff --name-only HEAD~3 2>/dev/null || true`

## Phase 1: Investigate

1. Restate the problem: expected vs actual behavior.
2. Determine scope: backend, frontend, or both.
3. If both, launch parallel sub-agents:
   - Backend agent: controllers, services, DTOs, tests.
   - Frontend agent: API clients, types, pages.
   - Consolidate before Phase 2.
4. Read the smallest relevant area first. Never read entire modules.
5. Cite every finding as `file:line`.

## Phase 2: Analyze

1. Find a working implementation similar to the broken one.
2. Compare: what differs?
3. Check recent commits: `git log --oneline -10 -- <file>`.
4. Identify root cause, not symptom.

## Phase 3: Hypothesize

1. Formulate ONE clear hypothesis.
2. Design a minimal test (change one variable).
3. Predict the expected outcome BEFORE running.
4. Execute and observe.
5. If disproved, return to Phase 2. Stop after 3 failed hypotheses.

## Phase 4: Plan

1. Scoped implementation plan (smallest fix for root cause).
2. Validation plan (which checks prove the fix).
3. Risks, assumptions, rollback needs.

## Rules

- Do not propose a fix without completing Phases 1-3.
- Targeted check first, then broader checks.
- Cite all findings with `file:line`.
- After 3 failed hypotheses, stop and recommend discussing architecture.
- Do not run broad test suites during investigation.

## Output

```text
Problem:
Expected behavior:
Actual behavior:

Phase 1 — Investigation:
- file:line — finding

Phase 2 — Analysis:
- Similar working implementation: file:line
- Key difference: ...
- Root cause: ...

Phase 3 — Hypothesis:
- Hypothesis: ...
- Test: ...
- Result: confirmed/disproved

Phase 4 — Plan:
- Implementation:
  - file:line — change description
- Validation:
  - Failing check before fix: ...
  - Passing checks after fix: ...
- Risks:
  - ...
```
