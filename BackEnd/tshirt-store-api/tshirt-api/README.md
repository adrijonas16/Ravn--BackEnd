# T-Shirt Store API

NestJS backend for the T-Shirt Store challenge. It exposes authentication,
catalog, cart, checkout, orders, delivery, notifications, and Stripe webhook
flows backed by PostgreSQL, Prisma, Redis/BullMQ, and JWT authentication.

## Requirements

- Node.js 20+
- npm
- Docker and Docker Compose

## Environment

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

The default `.env.example` values are ready for local Docker:

- PostgreSQL: `127.0.0.1:5433`
- Redis: `127.0.0.1:6379`
- API: `http://localhost:3000`

For real Stripe checkout/webhook testing, replace these placeholders:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

AWS S3 variables are only required for real product image upload storage.

## Local Setup

Install dependencies:

```bash
npm install
```

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

Generate Prisma Client if needed:

```bash
npx prisma generate
```

Seed the database:

```bash
npm run seed
```

Start the API in watch mode:

```bash
npm run start:dev
```

The API listens on `http://localhost:3000` by default.

Swagger docs are available at:

```text
http://localhost:3000/api/docs
```

## Verification Commands

Run unit tests:

```bash
npm run test
```

Run e2e tests:

```bash
npm run test:e2e
```

Run test coverage:

```bash
npm run test:cov
```

Run the production build:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Format source and test files:

```bash
npm run format
```

## E2E Test Database

The e2e suite defaults to a dedicated PostgreSQL schema inside the local
database:

```text
postgresql://postgres:pass_nerdery@127.0.0.1:5433/tshirt_store?schema=tshirt_store_test
```

Override it with `TEST_DATABASE_URL` when needed:

```bash
TEST_DATABASE_URL="postgresql://postgres:pass_nerdery@127.0.0.1:5433/tshirt_store?schema=tshirt_store_test" npm run test:e2e
```

The e2e command sets `QUEUES_ENABLED=false`, so Redis workers do not process
background jobs during test execution.

## Useful Prisma Commands

Create a migration during development:

```bash
npx prisma migrate dev --name <migration_name>
```

Reset the local database and apply seed data:

```bash
npx prisma migrate reset
```

Open Prisma Studio:

```bash
npx prisma studio
```

## Production Run

Build and run the compiled API:

```bash
npm run build
npm run start:prod
```

Required production services:

- PostgreSQL reachable through `DATABASE_URL`
- Redis reachable through `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`
- Stripe keys and webhook secret configured in the environment
- Strong `JWT_SECRET`

## Main Scripts

```text
npm run start          # start NestJS once
npm run start:dev      # start NestJS in watch mode
npm run start:prod     # run compiled app from dist
npm run build          # compile TypeScript
npm run lint           # eslint with autofix
npm run format         # prettier write
npm run test           # unit tests
npm run test:e2e       # e2e tests
npm run test:cov       # coverage
npm run seed           # seed Prisma data
```
