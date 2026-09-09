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

