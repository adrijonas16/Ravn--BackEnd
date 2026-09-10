---
name: test-coverage
description: >
  Check test coverage for a module or the full backend before merging.
  Triggers: "check coverage", "untested code", "what needs tests",
  "coverage report", "is this tested", "missing tests",
  reviewing a PR with new service logic.
  Finds untested critical paths and suggests test cases.
argument-hint: "[module name or 'all']"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(npx jest *)
  - Bash(npm run test *)
---

# Test Coverage

Find missing coverage before it becomes a production bug.

For project paths, modules, and commands, read `reference.md` in this skill's directory.

## Steps

1. Identify the module or file to check.
2. Run targeted coverage from the backend directory:
   - Single module: `npx jest --coverage --collectCoverageFrom='src/<module>/**/*.ts' -- <module> --runInBand`
   - Full backend: `npx jest --coverage --runInBand`
3. Read the coverage summary (statements, branches, functions, lines).
4. Identify uncovered lines — cite `file:line`.
5. Classify each uncovered area:
   - **Critical**: validation, business logic, error handling.
   - **Non-critical**: module definitions, re-exports, boilerplate.
6. Suggest specific test cases for critical uncovered paths.
7. Do NOT write tests unless asked. Report findings first.

## Rules

- Never lower coverage thresholds to make the check pass.
- Focus on business logic and validation, not boilerplate.
- Distinguish unit-testable logic from integration-only code (e.g., Prisma queries).
- Report mock boundaries: code tested via mocks may still fail in integration.
- Cite all uncovered paths with `file:line`.

## Output

```text
Module checked:

Coverage summary:
- statements: X%
- branches: X%
- functions: X%
- lines: X%

Critical uncovered paths:
- file:line — description of untested logic

Non-critical uncovered paths:
- file:line — description

Suggested test cases:
- test name — what it proves

Mock boundaries:
- service/dependency — what is mocked vs real
```
