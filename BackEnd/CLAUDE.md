# Project Guidance

This repository contains the T-Shirt Store backend and frontend under `BackEnd/tshirt-store-api`.

## Stack

- **Backend**: NestJS 11 + Prisma 5 + PostgreSQL + TypeScript
- **Auth**: JWT (passport-jwt) + bcrypt + refresh token rotation
- **Authorization**: CASL (role-based: manager, client, delivery_person)
- **Payments**: Stripe (PaymentIntent + Checkout Sessions)
- **Queue**: BullMQ + Redis (notifications, emails)
- **Storage**: AWS S3 (product images)
- **Logging**: Pino (nestjs-pino) with sensitive field redaction
- **Security**: Helmet, ThrottlerGuard (rate limiting), CORS
- **Scheduling**: @nestjs/schedule (abandoned order cleanup)
- **Frontend**: React + Vite + TypeScript

## Commands

```bash
# Backend (from tshirt-store-api/tshirt-api/)
npm run build                    # NestJS build
npm run start:dev                # dev server with watch
npm run test -- --runInBand      # all unit tests
npm run test -- <pattern>        # targeted tests
npm run test:cov                 # coverage report
npm run seed                     # seed database
npx eslint "{src,apps,libs,test}/**/*.ts"  # lint

# E2E tests (needs running Postgres)
TEST_DATABASE_URL="postgresql://..." QUEUES_ENABLED=false \
  npx jest --config ./test/jest-e2e.json --runInBand

# Playwright (needs running backend)
npx playwright test

# Frontend (from tshirt-store-api/tshirt-frontend/)
npm run dev                      # dev server
npm run build                    # production build
npm run lint                     # lint check

# Infrastructure
docker compose up -d             # Postgres + Redis
npx prisma migrate deploy        # apply migrations
npm run seed                     # seed demo data
```

## Architecture

### Module Structure

```
src/
├── app.module.ts          # Root — registers all modules
├── main.ts / create-app.ts # Bootstrap (Helmet, CORS, ValidationPipe, Swagger)
├── config/                # Environment validation
├── prisma/                # PrismaService (global)
├── casl/                  # CASL permission factory (global)
├── auth/                  # Signup, signin, signout, refresh, forgot/reset password
├── products/              # CRUD + variants/SKUs + images (S3)
├── categories/            # CRUD for managers, read for all
├── cart/                  # Add/update/remove items, auto-create cart
├── orders/                # Create from cart, status machine, delivery assignment
├── payments/              # Stripe PaymentIntent + Checkout + refunds
├── webhooks/              # Stripe webhook handler (payment success/failure)
├── promo-codes/           # Create/update (manager), preview (client)
├── delivery/              # Delivery person: list assigned, mark delivered
├── addresses/             # Client shipping addresses
├── likes/                 # Product wishlist
├── notifications/         # Low-stock alerts, order notifications
└── storage/               # S3 upload/download/presigned URLs
```

### Database Schema (Prisma)

Core models: User, Role, Product, ProductVariant, Category, Cart, CartItem,
Order, OrderItem, Payment, PromoCode, PromoCodeRedemption, Address,
InventoryMovement, OrderStatusHistory, Notification, StripeWebhookEvent.

- **Soft deletes**: Products use `deletedAt` + `status: disabled`
- **Audit trails**: OrderStatusHistory, InventoryMovement
- **Token security**: RefreshToken and PasswordResetToken stored as SHA-256 hashes

### Auth Flow

- JWT access token (1d expiry) with payload: `{ sub, email, role }`
- Refresh token: 64-byte hex, stored as hash, 7-day expiry, rotation on use
- Password reset: 32-byte hex token, 1-hour TTL, one-time use
- JwtStrategy.validate() checks user exists AND `status === 'active'` on every request

### Order State Machine

```
pending → cancelled
paid → processing | cancelled
processing → shipped | cancelled
shipped → delivered
```

### Data Flows

**Cart → Order → Payment:**
1. Client adds items to cart (`POST /cart/items`)
2. Client creates order (`POST /orders`) — stock reserved inside transaction with FOR UPDATE lock
3. Client pays via PaymentIntent or Checkout link
4. Webhook confirms payment → order status changes to `paid`
5. If no payment in 2h → cron auto-cancels and restores stock

**Direct Purchase (payment link):**
1. `POST /payments/payment-link` creates order + reserves stock in one transaction
2. Stripe Checkout handles payment
3. Webhook confirms → status changes to `paid`

**Cancellation (any path):**
1. Stock restored (`increment`)
2. InventoryMovement created (type: `cancellation`)
3. PromoCodeRedemption deleted
4. Refund triggered if order was paid

## Coding Standards

### Transactions and Concurrency

- `$transaction` gives atomicity (all or nothing), NOT concurrency control.
- Use `SELECT ... FOR UPDATE` inside `$transaction` when a row must not be
  read by concurrent requests (e.g., cart-to-order conversion).
- Never hardcode schema names in raw SQL — Prisma sets `search_path`
  automatically. Use `"carts"` not `"tshirt_store"."carts"`.
- Read-only ownership checks (address belongs to user) can stay outside
  the transaction.

### Stock and Inventory

- Stock is reserved at order creation, not at payment.
- Every code path that decrements stock must have a corresponding restore
  path (cancel, payment failure, abandoned order cron).
- All stock operations must happen inside a `$transaction`.
- When adding a new order-creation path, it MUST include stock reservation.

### Promo Codes

- `PromoCodeRedemption` must be deleted on any cancellation path.
- One use per user per promo code — check with `findFirst({ promoCodeId, userId })`.
- Same validation in `orders.service.ts create()` and `promo-codes.service.ts previewForCart()`.

### Product Lifecycle

- Soft-delete cascades: product deleted → all variants set `isActive: false`.
- Cart validation checks three things: `sku.isActive`, `sku.product.deletedAt`,
  AND `sku.product.status === 'active'`.
- Likes also check `product.status === 'active'`.

### Idempotency

- Webhook handlers: try/catch on `create`, catch P2002 (unique constraint).
  Never `findUnique` + `create` separately.
- PaymentIntent: check for existing pending payment before creating new one in Stripe.

### API Design

- Static routes before dynamic routes in controllers
  (`GET /delivery-persons` before `GET /:orderId`).
- Consistent response shapes for list and detail (Number for decimals, flattened objects).
- All list endpoints paginated: `{ data, meta: { page, limit, totalItems, totalPages } }`.
- Cart items max 99 per SKU.
- Use `toMoney()` from `src/common/utils/money.ts` for Decimal → number.

### Guards and Authorization

- Every protected endpoint needs `@UseGuards(JwtAuthGuard)`.
- Role-restricted endpoints add `@Roles('manager')` + `@UseGuards(RolesGuard)`.
- Fine-grained permissions use `@RequireAbility('action', 'Subject')` + `PoliciesGuard`.
- Roles: `manager` (full CRUD), `client` (own data), `delivery_person` (assigned orders).

### Constants

- `MAX_ACTIVE_DELIVERIES = 5` — `src/common/constants/delivery.constants.ts`
- `LOW_STOCK_THRESHOLD = 3` — `src/common/constants/inventory.constants.ts`
- `ABANDONED_ORDER_HOURS = 2` — `src/common/constants/order.constants.ts`

## Testing Standards

### Unit Tests

- Mock `$queryRaw` when service uses raw SQL.
- Mock `$transaction` to support both callback and array forms:
  ```typescript
  $transaction: jest.fn((input) =>
    Array.isArray(input) ? Promise.all(input) : input(prisma),
  ),
  ```
- When adding a new Prisma method (e.g., `deleteMany`), add it to the mock.
- When changing response shapes, update test mocks to include new fields.

### E2E Tests

- Test schema: `tshirt_store_test` via `TEST_DATABASE_URL`.
- Use `execSync` not `execFileSync` for npx commands.
- Add `transformIgnorePatterns` for ESM packages in `jest-e2e.json`:
  ```json
  "transformIgnorePatterns": ["node_modules/(?!(@nestjs/schedule)/)"]
  ```

### Playwright

- Config: `playwright.config.ts` with `video: 'on'`.
- Tests: `test/demo-recording.spec.ts`.
- Stress tests need bash with `&` for true parallelism.

## Branch and PR Conventions

- Branch naming: `<type>/<short-description>` (e.g., `fix/cart-quantity-validation`).
- Commit messages: imperative mood, under 72 chars.
- Before merging, all must pass:
  - `npm run test -- --runInBand`
  - `npm run build`
  - `npx eslint "{src,apps,libs,test}/**/*.ts"`
  - E2E tests (when DB available)

## Available Skills

- `/investigate-task` — Research a bug before writing code
- `/verify-change` — Run checks after a fix
- `/api-contract-check` — Verify backend/frontend types match
- `/db-check` — Verify Prisma schema and DTOs are in sync
- `/security-check` — Check for missing guards and unsafe patterns
- `/test-coverage` — Find untested critical paths
- `/env-check` — Verify environment variables
- `/docs-sync` — Check if docs need updates
