---
name: env-check
description: >
  Verify environment variables are present and valid.
  Triggers: "env missing", "connection refused", "database won't connect",
  "check env", "setup the project", "ECONNREFUSED", "auth fails locally",
  service fails with config-related error.
argument-hint: "[service or variable to check]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(npx prisma migrate status)
  - Bash(docker ps *)
---

# Env Check

Catch missing or misconfigured variables before runtime errors.

For project paths and commands, read `reference.md` in this skill's directory.

## Dynamic Context

!`cd BackEnd/tshirt-store-api/tshirt-api && npx prisma migrate status 2>&1 | tail -3 || true`

## Steps

1. Read `.env.example` to identify all expected variables.
2. Read `.env` to identify which variables are set.
3. Compare and report:
   - Variables in `.env.example` but missing from `.env`.
   - Variables in `.env` but not in `.env.example` (may need documenting).
4. Validate format WITHOUT exposing values:
   - `DATABASE_URL`: starts with `postgresql://`, contains host/port/db.
   - `JWT_SECRET`: is set and non-empty.
   - `STRIPE_SECRET_KEY`: starts with `sk_test_` or `sk_live_`.
   - `AWS_*` / `S3_*`: are set if storage module is active.
5. Test database connectivity: `npx prisma migrate status`.
6. Check Docker services if needed: `docker ps --filter name=postgres`.
7. NEVER print or log actual secret values.

## Rules

- NEVER print, log, or include secret values in output.
- Do not modify `.env` without user confirmation.
- If `.env.example` does not exist, flag it as a documentation gap.
- Prefer `prisma migrate status` over raw queries to test connectivity.

## Output

```text
Environment checked:

Missing variables:
- VAR_NAME — required by: module/feature

Extra variables (not in .env.example):
- VAR_NAME — consider documenting

Format validation:
- DATABASE_URL: valid/invalid
- JWT_SECRET: present/missing

Service connectivity:
- database: connected/failed — detail
- docker: running/stopped

Recommended actions:
- ...
```
