---
name: env-check
description: Verify that required environment variables are present and valid. Use this when setting up the project, after changing config, or when a service fails to connect.
---

# Env Check

Use this skill to verify environment configuration. The goal is to catch missing or misconfigured variables before they cause runtime errors.

## Input

A service that fails to connect, a new config requirement, or a general environment health check.

Good inputs:

- "Check if all required env vars are set for the backend."
- "Check why the database connection fails."
- "Check if Stripe keys are configured after adding the payments module."

## Working Directories

- Backend env file: `BackEnd/tshirt-store-api/tshirt-api/.env`
- Backend env example: `BackEnd/tshirt-store-api/tshirt-api/.env.example`
- Frontend env file: `BackEnd/tshirt-store-api/tshirt-frontend/.env`

Always `cd` to the correct directory before running any command.

## Steps

1. Read `.env.example` to identify all expected variables.
2. Read `.env` to identify which variables are set.
3. Compare and report:
   - Variables in `.env.example` but missing from `.env`.
   - Variables in `.env` but not in `.env.example` (may need documenting).
4. For each required variable, check format without exposing values:
   - `DATABASE_URL`: starts with `postgresql://`, contains host/port/db.
   - `JWT_SECRET`: is set and non-empty.
   - `STRIPE_SECRET_KEY`: starts with `sk_test_` or `sk_live_`.
   - `AWS_*` / `S3_*`: are set if storage module is active.
5. Test database connectivity: `npx prisma db execute --stdin <<< "SELECT 1"` or `npx prisma migrate status`.
6. Check that Docker services are running if needed: `docker ps --filter name=postgres`.
7. Do not print or log actual secret values. Only report whether they are present and correctly formatted.

## Rules

- NEVER print, log, or include secret values in the output. Only report presence and format.
- Do not modify `.env` without user confirmation.
- If `.env.example` does not exist, flag it as a documentation gap.
- Prefer `prisma migrate status` over raw database queries to test connectivity.

## Output

Return an environment report in this format:

```text
Environment checked:

Missing variables:
- VAR_NAME — required by: module/feature

Extra variables (not in .env.example):
- VAR_NAME — consider documenting

Format validation:
- DATABASE_URL: valid/invalid format
- JWT_SECRET: present/missing
- ...

Service connectivity:
- database: connected/failed (details)
- docker: running/stopped

Recommended actions:
- ...
```
