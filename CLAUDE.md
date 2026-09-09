# Project Guidance

This repository contains the T-Shirt Store backend and frontend under `BackEnd/tshirt-store-api`.

## Backend

- Path: `BackEnd/tshirt-store-api/tshirt-api`
- Framework: NestJS, Prisma, Jest
- Targeted tests: `npm run test -- <pattern> --runInBand`
- Full unit tests: `npm run test -- --runInBand`
- Build: `npm run build`

## Frontend

- Path: `BackEnd/tshirt-store-api/tshirt-frontend`
- Framework: React, Vite, TypeScript
- Build check: `npm run build`
- Lint check: `npm run lint`

## Available Skills

Use these skills when the task matches their purpose:

- `/investigate-task` — Research a bug or improvement before writing code. Produces a scoped plan with relevant files, risks, and validation steps.
- `/verify-change` — Run targeted checks after a fix to produce evidence that the change works. Covers backend tests/build/lint and frontend build/lint.
- `/api-contract-check` — Verify that backend DTOs/controllers and frontend API clients/types agree. Catches request/response/error mismatches.
- `/docs-sync` — Check whether documentation needs updates after a code change. Reviews READMEs, API docs, and setup notes.
- `/db-check` — Verify Prisma schema, migrations, and DTOs are in sync. Catches schema drift and field mismatches.
- `/security-check` — Check for missing guards, leaked fields, and unsafe patterns. Covers auth, validation, and data exposure.
- `/test-coverage` — Check test coverage for a module or the full backend. Finds untested critical paths and suggests test cases.
- `/env-check` — Verify environment variables are present and correctly formatted. Tests service connectivity without exposing secrets.

All skills are also available as slash commands via `.claude/commands/`. Type `/command-name <description>` to invoke them.

## Working Rules

- Keep changes scoped to the requested feature or bug.
- Prefer existing service tests for backend behavior.
- Add or update tests before changing behavior when reproducing a bug.
- Treat external services such as Stripe, Redis, S3, and email as mocked unless explicitly configured.
- Do not commit secrets or local environment files.

## Branch and PR Conventions

- Branch naming: `<type>/<short-description>` (e.g., `fix/cart-quantity-validation`, `feat/promo-codes`, `chore/update-deps`).
- Commit messages: start with a verb in imperative mood (e.g., "Add", "Fix", "Update", "Remove"). Keep the first line under 72 characters.
- PR title: short, under 70 characters. Use the body for details.
- Before merging, all of these must pass:
  - Backend: `npm run test -- --runInBand`, `npm run build`, `npx eslint "{src,apps,libs,test}/**/*.ts"`
  - Frontend: `npm run build`, `npm run lint`

