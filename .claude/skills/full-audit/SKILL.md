---
name: full-audit
description: >
  Run a comprehensive audit of the entire application: environment, database,
  security, tests, API contracts, and documentation. Use before a PR, after a
  major refactor, or when onboarding to verify everything is in sync.
  Triggers: "full audit", "check everything", "pre-PR check", "is the project healthy",
  "run all checks", "audit the whole app".
argument-hint: "[optional: focus area or module to emphasize]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(npm run test* --runInBand)
  - Bash(npm run build)
  - Bash(npx eslint *)
  - Bash(npx prisma migrate status)
  - Bash(npx prisma validate)
  - Bash(docker ps *)
---

# Full Audit

Comprehensive health check across the entire application. Runs each specialized
skill in sequence and produces a consolidated report.

**NEVER print, log, or include actual secret values in any output.**

For project paths and commands, read `reference.md` in this skill's parent directory.

## Dynamic Context

!`cd BackEnd/tshirt-store-api/tshirt-api && npx prisma migrate status 2>&1 | tail -5 || true`
!`cd BackEnd/tshirt-store-api/tshirt-api && npm run test -- --runInBand 2>&1 | tail -10 || true`

## Checks (run in order)

### 1. Environment (`env-check`)
- Compare `.env.example` vs `.env` — report missing/extra variables (names only).
- Validate formats without exposing values.
- Test database connectivity via `prisma migrate status`.
- Check Docker services if applicable.

### 2. Database (`db-check`)
- Run `prisma validate` and `prisma migrate status`.
- Compare schema fields vs DTOs — report drift with file:line.
- Check for missing migrations or pending changes.

### 3. Security (`security-check`)
- Verify `@UseGuards` and `@Roles` on every controller endpoint.
- Check `@Exclude` on sensitive entity fields.
- Look for input validation gaps, IDOR risks, mass assignment.
- Verify no secrets in code or logs.

### 4. Tests (`test-coverage`)
- Run `npm run test -- --runInBand` and report pass/fail count.
- Identify untested critical paths (services with no `.spec.ts`).
- Suggest missing test cases for uncovered modules.

### 5. Build & Lint
- Backend: `npm run build` — report success or errors.
- Backend: `npx eslint "{src,apps,libs,test}/**/*.ts"` — report violations.
- Frontend (if present): `npm run build` and `npm run lint`.

### 6. API Contracts (`api-contract-check`)
- Compare backend DTOs/controllers with frontend API clients.
- Check request/response shapes, error envelopes, status codes.
- Report mismatches with file:line on both sides.

### 7. Documentation (`docs-sync`)
- Check READMEs, API docs, and setup instructions against current code.
- Flag outdated examples, wrong commands, or missing documentation.

## Rules

- Run each check fully — do not skip a section because a previous one failed.
- Report findings per section, then a consolidated summary at the end.
- Classify findings: CRITICAL (blocks deployment), WARNING (should fix), INFO (nice to have).
- If a check cannot run (e.g., no Docker, no `.env`), report it as SKIPPED with the reason.
- Do not modify any files — this is a read-only audit. Recommend fixes but don't apply them.

## Output

```text
Full Audit Report
=================

1. ENVIRONMENT
   Status: OK / ISSUES / SKIPPED
   - ...

2. DATABASE
   Status: OK / ISSUES / SKIPPED
   - ...

3. SECURITY
   Status: OK / ISSUES
   - ...

4. TESTS
   Status: X passed, Y failed
   - Untested: ...

5. BUILD & LINT
   Backend build: OK / FAILED
   Backend lint: OK / X violations
   Frontend build: OK / FAILED / N/A

6. API CONTRACTS
   Status: OK / X mismatches
   - ...

7. DOCUMENTATION
   Status: OK / X outdated sections
   - ...

Summary
-------
CRITICAL: X findings
WARNING: Y findings
INFO: Z findings

Recommended actions (priority order):
1. ...
2. ...
```
