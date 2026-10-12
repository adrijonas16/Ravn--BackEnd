# Project Guidance

This repository contains the T-Shirt Store backend and frontend under `BackEnd/tshirt-store-api`.

## Backend

- Path: `BackEnd/tshirt-store-api/tshirt-api`
- Framework: NestJS, Prisma, Jest
- Targeted tests: `npm run test -- <pattern> --runInBand`
- Full unit tests: `npm run test -- --runInBand`
- E2E tests: `TEST_DATABASE_URL="postgresql://postgres:pass_nerdery@127.0.0.1:5434/nerdery_db?schema=tshirt_store_test" QUEUES_ENABLED=false npx jest --config ./test/jest-e2e.json --runInBand`
- Build: `npm run build`
- Lint: `npx eslint "{src,apps,libs,test}/**/*.ts"`
- Playwright: `npx playwright test`

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

---

## Architecture Rules (from audit)

These rules were established during the API audit. They must be followed
in all future changes.

### Transactions and Concurrency

- **$transaction gives atomicity, NOT concurrency control.** Prisma uses
  READ COMMITTED by default — two transactions can read the same row
  before either updates it.
- **Use SELECT ... FOR UPDATE** inside `$transaction` when a row must not
  be read by concurrent requests. Example: cart-to-order conversion.
- **Never use a hardcoded schema name** in raw SQL. Prisma sets
  `search_path` via the `?schema=` param in DATABASE_URL. Use just the
  table name (e.g., `"carts"` not `"tshirt_store"."carts"`).
- **Never read a row outside a transaction and act on it inside.** If the
  state matters (cart status, stock count), read it inside the tx.
- Read-only ownership checks (e.g., address belongs to user) can stay
  outside the transaction — they don't change state and don't benefit
  from locking.

### Stock and Inventory

- **Stock is reserved at order creation**, not at payment. This is the
  standard e-commerce pattern that prevents overselling.
- **Every code path that decrements stock must have a restore path:**
  - Manual cancellation → `updateStatus()` restores with `increment`
  - Payment failure (webhook) → `processPaymentFailure()` restores
  - Abandoned orders → `OrdersCleanupService` cron restores after 2h
- **All stock operations** (decrement, increment, inventory movements)
  must happen inside a `$transaction`.
- When adding a new order-creation path (like `createPaymentLink`),
  it MUST include stock reservation inside a transaction.

### Promo Codes

- **PromoCodeRedemption must be deleted** when an order is cancelled,
  payment fails, or the order is auto-cancelled by the cron.
- **Per-user limit**: one use per user per promo code. Check with
  `promoCodeRedemption.findFirst({ where: { promoCodeId, userId } })`.
- The same validation must exist in both `orders.service.ts create()`
  and `promo-codes.service.ts previewForCart()`.

### Product Lifecycle

- **Soft-delete must cascade**: when a product is soft-deleted, all its
  variants must be set to `isActive: false` in the same transaction.
- **Cart validation must check three things**: `sku.isActive`,
  `sku.product.deletedAt`, AND `sku.product.status === 'active'`.
- **Likes must also check** `product.status === 'active'`.

### Idempotency

- **Webhook handlers**: use try/catch on the `create` call and catch
  P2002 (unique constraint). Do NOT use `findUnique` + `create`
  separately — that has a race condition.
- **PaymentIntent creation**: always check for an existing pending
  payment before creating a new one in Stripe. Retrieve from Stripe
  to verify it's still active before reusing.

### API Design

- **Static routes before dynamic routes** in controllers. Example:
  `GET /orders/delivery-persons` must be defined BEFORE
  `GET /orders/:orderId`, or NestJS will try to parse
  "delivery-persons" as an integer.
- **Consistent response shapes**: list and detail endpoints for the
  same resource must return the same field structure (Number for
  decimals, flattened customer/address objects, etc).
- **Pagination on all list endpoints**: use `{ data, meta: { page,
  limit, totalItems, totalPages } }` pattern.
- **Quantity limits**: cart items max 99 per SKU.

### Delivery System

- `MAX_ACTIVE_DELIVERIES = 5` in `src/common/constants/delivery.constants.ts`.
- Only assign delivery to orders in `paid` or `processing` status.
- Validate that the user exists, has role `delivery_person`, and is active.
- `GET /orders/delivery-persons` returns workload dashboard for managers.

### Decimal Handling

- Use `toMoney()` from `src/common/utils/money.ts` for all Prisma
  Decimal → number conversions. Rounds to 2 decimal places.

---

## Testing Rules

### Unit Tests

- When using `$queryRaw` in a service, add `$queryRaw: jest.fn()` to
  the prisma mock object.
- When adding a new Prisma model method (e.g., `deleteMany` on
  `promoCodeRedemption`), add it to the mock.
- When changing response shapes (e.g., adding `user` relation to
  `findOne`), update the test mocks to include those fields.
- Mock `$transaction` to support both callback and array forms:
  ```typescript
  $transaction: jest.fn((input) =>
    Array.isArray(input) ? Promise.all(input) : input(prisma),
  ),
  ```

### E2E Tests

- Use `execSync` not `execFileSync` for npx commands (ENOENT on some platforms).
- Test database uses schema `tshirt_store_test` via `TEST_DATABASE_URL`.
- Add `transformIgnorePatterns` to `jest-e2e.json` for ESM-only packages:
  ```json
  "transformIgnorePatterns": ["node_modules/(?!(@nestjs/schedule)/)"]
  ```

### Playwright Tests

- Config at `playwright.config.ts` with `video: 'on'`, `trace: 'on'`.
- Test file at `test/demo-recording.spec.ts`.
- Each test renders an HTML page showing request/response for video evidence.
- Stress tests (concurrency) must use bash with `&` for true parallelism
  — Playwright `request` and Node.js `Promise.all` serialize requests.

---

## Available Skills

Use these skills when the task matches their purpose:

- `/investigate-task` — Research a bug or improvement before writing code.
- `/verify-change` — Run targeted checks after a fix.
- `/api-contract-check` — Verify backend DTOs and frontend types agree.
- `/docs-sync` — Check whether documentation needs updates.
- `/db-check` — Verify Prisma schema, migrations, and DTOs are in sync.
- `/security-check` — Check for missing guards and unsafe patterns.
- `/test-coverage` — Check test coverage for a module.
- `/env-check` — Verify environment variables are present.
