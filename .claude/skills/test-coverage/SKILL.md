---
name: test-coverage
description: Check test coverage for a specific module or the full backend. Use this before merging a PR or after adding new service logic to find untested code paths.
---

# Test Coverage

Use this skill to identify untested code in a module or across the backend. The goal is to find missing coverage before it becomes a production bug.

## Input

A module name, file, or feature area to check coverage for.

Good inputs:

- "Check test coverage for the cart module."
- "Check overall backend coverage."
- "Check if the new promo-code validation logic has tests."

## Working Directories

- Backend commands run from: `BackEnd/tshirt-store-api/tshirt-api`

Always `cd` to the backend directory before running any command.

## Steps

1. Identify the module or file to check.
2. Run a targeted coverage command:
   - Single module: `npx jest --coverage --collectCoverageFrom='src/<module>/**/*.ts' -- <module> --runInBand`
   - Full backend: `npx jest --coverage --runInBand`
3. Read the coverage summary (statements, branches, functions, lines).
4. Identify uncovered lines and branches from the report.
5. For each uncovered area, determine:
   - Is it a critical code path (validation, business logic, error handling)?
   - Is it an edge case that should be tested?
   - Is it boilerplate that does not need coverage (module definitions, re-exports)?
6. Suggest specific test cases for critical uncovered paths.
7. Do not write tests unless asked. Report findings first.

## Rules

- Do not lower coverage thresholds to make the check pass.
- Focus on business logic and validation coverage, not boilerplate.
- Distinguish between unit-testable logic and integration-only code (e.g., database queries via Prisma).
- Report mock boundaries: code tested via mocks may still fail in integration.

## Output

Return a coverage report in this format:

```text
Module checked:

Coverage summary:
- statements: X%
- branches: X%
- functions: X%
- lines: X%

Critical uncovered paths:
- file:line — description
- ...

Non-critical uncovered paths:
- file:line — description
- ...

Suggested test cases:
- ...

Mock boundaries:
- ...
```
