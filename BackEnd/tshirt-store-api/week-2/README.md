# Week 2 - REST Design + NestJS Foundations

## Deliverable

The Week 2 deliverable is the OpenAPI contract for the T-Shirt Store API:

- `openapi.yaml`

This specification builds on the Week 1 ERD and defines the REST resources,
request bodies, response schemas, status codes, and authorization boundaries
that will be implemented in Week 3.

## Covered API Areas

- Auth and password reset
- Product catalog
- Product SKUs
- Product images
- Categories
- Customer addresses
- Cart
- Orders and order status changes
- Stripe payment intent and payment link flows
- Stripe webhooks
- Product likes
- Promo codes
- Delivery person order flow

## Contract Decisions

- The API is versioned under `/api/v1`.
- Bearer JWT authentication is declared with the `BearerAuth` security scheme.
- Public endpoints are left without security requirements.
- Protected endpoints declare the expected authentication boundary.
- Collection endpoints use pagination where the response can grow.
- Errors use a shared `ErrorResponse` schema.
- Fixed domain values are represented as enums where appropriate.
- Request and response schemas include examples, formats, and constraints where
  useful for Swagger UI and generated clients.

## Final Validation Checklist

Before submitting:

1. Open `openapi.yaml` in Swagger Editor.
2. Confirm the specification parses with no errors.
3. Confirm every endpoint renders correctly.
4. Confirm the main resources are present: auth, products, SKUs, cart, orders,
   payments, addresses, likes, promo codes, and delivery.
5. Confirm protected endpoints show the bearer auth requirement.
6. Confirm common failure responses are documented, especially `400`, `401`,
   `403`, `404`, and `409` where they apply.
7. Submit `openapi.yaml` as the Week 2 API contract.

