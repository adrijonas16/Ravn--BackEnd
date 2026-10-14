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

