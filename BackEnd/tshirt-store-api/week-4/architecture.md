# T-Shirt Store API -- Production Architecture

## Production Diagram

```
                        Internet
                           |
                     [CloudFlare CDN]
                           |
                    [Load Balancer]
                     (ALB / Nginx)
                      /        \
              [API Pod 1]   [API Pod 2]   ... (NestJS, horizontal scale)
                 |    \         |    \
                 |     \        |     \
          [PgBouncer]   [Redis]   [PgBouncer]
               |            |         |
         [PostgreSQL]   [BullMQ Workers]
          (RDS, 1 writer + read replicas)
                            |
                    [Stripe / SMTP]
```

### Component Responsibilities

| Component | Role |
|-----------|------|
| CloudFlare | TLS termination, DDoS protection, static-asset caching |
| ALB / Nginx | Layer-7 routing, health checks, rate-limit header forwarding |
| NestJS API pods | Stateless HTTP handlers, JWT auth, validation, Prisma queries |
| PgBouncer | Connection pooling (transaction mode, ~20 server connections per pod) -- prevents exhausting the 100-connection limit on RDS |
| PostgreSQL (RDS) | Single writer for OLTP; read replicas for reporting queries and order history listing |
| Redis (ElastiCache) | BullMQ job broker, optional session/cache store |
| BullMQ workers | Async jobs: email notifications, Stripe webhook retry, inventory reconciliation |
| Stripe | Payment processing via Payment Links and webhooks |

## Queue Decision: Why BullMQ

We chose **BullMQ** (Redis-backed) over the other main contenders:

| Criteria | BullMQ | @nestjs/bull (Bull v3) | RabbitMQ | SQS |
|----------|--------|----------------------|----------|-----|
| NestJS integration | First-class `@nestjs/bullmq` | Legacy, frozen API | Needs extra adapter | Needs extra adapter |
| Retry / backoff | Built-in exponential backoff, per-job config | Basic retry | Manual DLQ wiring | Built-in but opaque |
| Observability | Bull Board UI, events | Bull Board (v3) | Management plugin | CloudWatch only |
| Infra cost | Reuses existing Redis | Reuses existing Redis | Separate broker cluster | Per-request pricing |
| Scaling | Dedicated worker processes, concurrency knob | Same | Competing consumers | Lambda triggers |

**Bottom line:** BullMQ gives us retry semantics, job prioritization, and a monitoring dashboard while reusing the Redis instance we already run for caching.  No extra infrastructure to provision.

## Deploy Shape

Target: **AWS ECS Fargate** (or EKS if the team prefers K8s).

```
Environments:  staging  ->  production
CI/CD:         GitHub Actions

Pipeline stages:
  1. lint + typecheck (eslint, tsc --noEmit)
  2. unit tests   (jest --ci)
  3. e2e tests    (docker-compose up db + migrate + jest --config jest-e2e.json)
  4. docker build + push to ECR
  5. deploy to ECS (staging, then prod with manual approval)
```

### Infrastructure as Code

- **Terraform** (or CDK) manages: VPC, RDS, ElastiCache, ECS services, ALB, CloudWatch dashboards.
- **Prisma Migrate** runs as an ECS one-shot task during deploy (before rolling update).

### Scaling Rules

- API pods: 2 minimum, auto-scale on CPU > 60% (max 8).
- BullMQ worker: 1 minimum, scale on queue depth via CloudWatch custom metric.
- RDS: db.t3.medium (staging), db.r6g.large (production), storage auto-scaling.

## What to Monitor

### Application Metrics (Prometheus / CloudWatch)

| Metric | Alert threshold |
|--------|----------------|
| HTTP p99 latency | > 500 ms for 5 min |
| HTTP 5xx rate | > 1% of requests over 5 min |
| Active DB connections (PgBouncer) | > 80% of pool size |
| BullMQ queue depth | > 500 waiting jobs for 10 min |
| BullMQ failed-job count | > 0 (page on repeated failures) |
| JWT auth failures (401s) | Spike > 50/min (brute-force signal) |

### Infrastructure Metrics

| Metric | Alert threshold |
|--------|----------------|
| ECS task CPU | > 80% sustained 10 min |
| ECS task memory | > 85% |
| RDS CPU | > 70% sustained 10 min |
| RDS free storage | < 20% |
| Redis memory usage | > 75% of max |
| Redis evictions | > 0 |

### Business Metrics (dashboard, no page)

- Orders created per hour
- Payment success vs. failure ratio
- Average order value
- Cart abandonment rate (carts with status "abandoned" / total carts)

### Logging

- Structured JSON logs (NestJS + Pino) shipped to CloudWatch Logs or Datadog.
- Request-id correlation header propagated through all layers.
- Sensitive fields (password, token) redacted at the logger level.
