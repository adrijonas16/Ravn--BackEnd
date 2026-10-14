# Project Reference

Read this file when a skill requires project-specific paths, modules, or commands.

## Repository Layout

```
BackEnd/tshirt-store-api/
  tshirt-api/          ← NestJS backend
  tshirt-frontend/     ← React + Vite frontend
```

## Backend (tshirt-api)

- Working directory: `BackEnd/tshirt-store-api/tshirt-api`
- Framework: NestJS, Prisma 5, Jest, Passport JWT
- Entry point: `src/main.ts` → `src/create-app.ts`

### Modules

| Module | Path | Responsibility |
|---|---|---|
| auth | `src/auth/` | signup, signin, signout, forgot/reset password |
| products | `src/products/` | CRUD products + SKU variants |
| cart | `src/cart/` | cart items, quantity validation |
| orders | `src/orders/` | order lifecycle |
| payments | `src/payments/` | Stripe integration |
| delivery | `src/delivery/` | delivery tracking |
| promo-codes | `src/promo-codes/` | discount codes |
| categories | `src/categories/` | product categories |
| likes | `src/likes/` | product likes/favorites |
| addresses | `src/addresses/` | user addresses |
| storage | `src/storage/` | file uploads (S3) |
| notifications | `src/notifications/` | email/push notifications |
| casl | `src/casl/` | CASL ability factory |

### Auth Architecture

- Guards: `JwtAuthGuard`, `RolesGuard` (in `src/auth/guards/`)
- Decorators: `@Roles()`, `@CurrentUser()`, `@Public()`
- Roles: `manager`, `client`, `delivery_person`
- Strategy: JWT via Passport (`src/auth/strategies/`)

### Backend Commands

```bash
cd BackEnd/tshirt-store-api/tshirt-api
npm run test -- <spec-file> --runInBand    # targeted test
npm run test -- --runInBand                # all tests
npm run build                              # compile check
npx eslint "{src,apps,libs,test}/**/*.ts"  # lint (no auto-fix)
npx jest --coverage --runInBand            # coverage
npx prisma validate                        # schema check
npx prisma migrate status                  # migration check
```

### Database

- ORM: Prisma 5
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- DB: PostgreSQL on port 5434 (Docker)

## Frontend (tshirt-frontend)

- Working directory: `BackEnd/tshirt-store-api/tshirt-frontend`
- Framework: React, Vite, TypeScript

### Frontend Structure

| Area | Path |
|---|---|
| API clients | `src/api/` |
| Domain types | `src/types/` |
| Pages | `src/pages/` |
| Components | `src/components/` |

### Frontend Commands

```bash
cd BackEnd/tshirt-store-api/tshirt-frontend
npm run build    # compile + typecheck
npm run lint     # lint
```

## External Services (mocked unless configured)

- Stripe (payments)
- S3 (file storage)
- Email (notifications)
- Redis (if caching enabled)
