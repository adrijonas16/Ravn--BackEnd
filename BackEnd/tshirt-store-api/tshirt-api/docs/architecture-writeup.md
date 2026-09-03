# T-Shirt Store API Architecture

## Production Shape

```
Client Web App
    |
    | HTTPS REST + JWT
    v
NestJS API
    |-- Auth, products, cart, orders, payments controllers
    |-- ValidationPipe, JWT guards, CASL policies, exception filter
    |-- Helmet, CORS allowlist, rate limiting, structured Pino logs
    |
    | Prisma pooled connections
    v
PostgreSQL
    |-- users, roles, products, variants, carts, orders, payments
    |-- inventory movements, webhook idempotency, notifications

NestJS API --> Redis/BullMQ queue --> Notification processor
NestJS API --> Stripe API
Stripe Webhooks --> NestJS API webhook endpoint
NestJS API --> S3-compatible object storage for product images

Git commit --> CI pipeline --> lint + unit tests + e2e tests + build
           --> run Prisma migrations --> deploy API --> smoke test
```

## Rationale

The API stays synchronous for operations the user must see immediately: authentication, cart edits, order creation, stock validation, payment session creation, and webhook acknowledgement. Notification work comes off the request path through BullMQ because it is retryable, does not need to block checkout, and depends on Redis already present in the stack. Low-stock notification jobs use exponential backoff and fall back to direct notification creation when the queue is disabled or unavailable.

Checkout consistency is protected at the payment boundary. Orders start as `pending`; Stripe webhooks verify signatures and are stored by Stripe event id before processing so duplicates are ignored. The successful payment path runs order status update, payment update, stock decrement, and inventory movement in one database transaction. If stock is unavailable when the webhook arrives, payment is marked failed and stock is not decremented. This is the main seam to monitor because money and inventory can disagree if webhook processing fails after Stripe succeeds.

Deployment should run migrations before releasing the new API version, with rollback handled by redeploying the previous image and keeping migrations backward compatible. Prisma should connect through the platform's pooled Postgres endpoint in production to avoid exhausting database connections during scale-out.

The top security risks for this API are broken object-level authorization on orders, webhook replay or forged Stripe events, and credential/token leakage through logs. CASL policies and service-level ownership checks protect order access. Stripe signatures plus webhook idempotency protect payment events. Pino redaction avoids logging passwords, tokens, cookies, and reset secrets.

Monitor request error rate and latency, failed auth/authorization attempts, Stripe webhook failures and duplicates, payment/order mismatches, queue depth and failed jobs, Redis/Postgres availability, stock going negative, and notification delivery failures.
