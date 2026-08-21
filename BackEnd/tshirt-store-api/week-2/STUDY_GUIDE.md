# Week 2 Study Guide - T-Shirt Store API Contract

## What Was Delivered

The Week 2 deliverable is the OpenAPI/Swagger contract for the T-Shirt Store
API:

- `openapi.yaml`

This is not the final backend implementation. It is the API contract that the
Week 3 NestJS implementation should follow.

The contract defines:

- Which endpoints exist.
- Which HTTP method each endpoint uses.
- Which request body each endpoint expects.
- Which response shape each endpoint returns.
- Which status codes can happen.
- Which endpoints are public.
- Which endpoints require Bearer JWT authentication.
- Which role boundaries apply to client, manager, and delivery person flows.

## Why OpenAPI Matters

OpenAPI is the agreement between backend and frontend.

The backend promises:

- These are the routes.
- These are the request fields.
- These are the response fields.
- These are the errors consumers need to handle.
- This is where authentication is required.

The frontend can build against this contract before the backend is fully
implemented. If the backend later changes a field name, status code, or required
request field without updating the contract intentionally, it can break the
consumer.

Example:

```json
{
  "id": 1,
  "orderNumber": "ORD-2026-0001",
  "currentStatus": "pending",
  "totalAmount": 59.98
}
```

That is a response shape. It tells the consumer exactly what the backend returns
for an order summary.

## Main API Areas Covered

### Auth

Auth endpoints handle account creation and login flows.

Main endpoints:

- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/signout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Things to defend:

- Signup uses `POST` because it creates a user account.
- Signin uses `POST` because credentials are sent in the body and a token is
  created.
- Protected endpoints use the `BearerAuth` security scheme.
- Auth responses return an `accessToken` and a `user` summary.

### Products

Product endpoints expose the catalog.

Main endpoints:

- `GET /products`
- `POST /products`
- `GET /products/{productId}`
- `PATCH /products/{productId}`
- `DELETE /products/{productId}`

Things to defend:

- Listing and detail are public because customers need to browse products.
- Create, update, and delete are manager-only operations.
- Delete is modeled as a soft delete in the system design, even though the API
  uses `DELETE`.
- Product responses include category, image, likes, and minimum price so the
  frontend does not need many extra calls per product.

### SKUs

SKUs represent product variants: size, color, price, and stock.

Main endpoints:

- `GET /products/{productId}/skus`
- `POST /products/{productId}/skus`
- `PATCH /products/{productId}/skus/{skuId}`

Things to defend:

- SKUs are nested under products because they belong to a specific product.
- Stock and price live on the SKU, not the product, because each size/color
  combination can have different inventory and price.
- Creating or updating SKUs is manager-only.

### Categories

Categories group products.

Main endpoint:

- `GET /categories`

Things to defend:

- Categories are public because they are needed for browsing/filtering the
  catalog.

### Addresses

Addresses are customer shipping addresses.

Main endpoints:

- `GET /addresses`
- `POST /addresses`
- `PATCH /addresses/{addressId}`
- `DELETE /addresses/{addressId}`

Things to defend:

- Address endpoints require authentication because addresses belong to a user.
- A client should only access their own addresses.
- Orders store an address snapshot so historical orders do not change if a user
  edits or deletes an address later.

### Cart

Cart endpoints manage the client's current shopping cart.

Main endpoints:

- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/{itemId}`
- `DELETE /cart/items/{itemId}`

Things to defend:

- Cart operations require authentication because the cart belongs to a client.
- Adding an item uses `POST` because it creates or adds a cart item.
- Updating quantity uses `PATCH` because only one field changes.
- Removing an item uses `DELETE`.

### Orders

Order endpoints manage checkout and order history.

Main endpoints:

- `POST /orders`
- `GET /orders`
- `GET /orders/{orderId}`
- `PATCH /orders/{orderId}/status`
- `POST /orders/{orderId}/cancel`

Things to defend:

- Creating an order uses `POST` because it creates a new order from the cart.
- A client sees only their own orders.
- A manager can see orders more broadly.
- Updating order status is restricted to manager or delivery-person flows.
- Cancel is a separate action endpoint because it represents a business action,
  not a normal field edit.

### Payments

Payment endpoints model Stripe payment flows.

Main endpoints:

- `POST /orders/{orderId}/payment-intent`
- `POST /payments/payment-link`
- `POST /webhooks/stripe`

Things to defend:

- Payment Intent is used for a checkout flow where the frontend confirms payment.
- Payment Link is used for a single-product purchase flow.
- Stripe webhook handling must verify Stripe signatures during implementation.
- The webhook endpoint exists because payment success/failure is confirmed by
  Stripe asynchronously.

### Likes

Likes let clients save or like products.

Main endpoints:

- `POST /products/{productId}/like`
- `DELETE /products/{productId}/like`

Things to defend:

- Like and unlike are client-only actions.
- The product response can include `likesCount` and `isLiked` to help the
  frontend render the product state.

### Promo Codes

Promo codes are optional discount functionality.

Main endpoints:

- `GET /promo-codes`
- `POST /promo-codes`
- `PATCH /promo-codes/{promoCodeId}`

Things to defend:

- Promo code management is manager-only.
- The schema includes discount type, discount value, expiration, usage limit,
  and minimum purchase amount.
- Discount types are enums: `percentage` and `fixed_amount`.

### Delivery

Delivery endpoints support delivery person operations.

Main endpoints:

- `GET /delivery/orders`
- `POST /delivery/orders/{orderId}/deliver`

Things to defend:

- Delivery users should only see assigned orders.
- Marking an order as delivered is a business action, so it is modeled as a
  dedicated endpoint.

## REST Decisions To Understand

### API Versioning

The API is versioned under:

```text
/api/v1
```

Why:

- It gives consumers a stable contract.
- If a future change breaks compatibility, a new version can be introduced
  instead of silently breaking existing clients.

### HTTP Methods

Use this explanation in review:

- `GET` reads data and should not change state.
- `POST` creates resources or triggers business actions.
- `PATCH` partially updates an existing resource.
- `DELETE` removes or disables a resource.

Examples:

- `GET /products` lists products.
- `POST /products` creates a product.
- `PATCH /products/{productId}` updates part of a product.
- `DELETE /cart/items/{itemId}` removes an item from the cart.

### Status Codes

Common status codes in the contract:

- `200 OK`: request succeeded and returns data.
- `201 Created`: resource was created.
- `204 No Content`: action succeeded and no body is returned.
- `400 Bad Request`: validation or input error.
- `401 Unauthorized`: missing or invalid authentication.
- `403 Forbidden`: authenticated, but not allowed.
- `404 Not Found`: resource does not exist or is not visible to the user.
- `409 Conflict`: request conflicts with existing state, such as duplicate
  email or invalid state transition.

### Authentication

The contract declares Bearer JWT authentication:

```yaml
BearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
```

That means protected requests must include:

```text
Authorization: Bearer <token>
```

### Authorization Boundaries

The API has three main roles:

- `client`
- `manager`
- `delivery_person`

Role examples:

- Public users can list and view products.
- Clients can manage their own cart, addresses, likes, and orders.
- Managers can manage products, SKUs, promo codes, and order status.
- Delivery persons can view assigned orders and mark them as delivered.

### Error Shape

The API uses a shared error response shape:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Why this matters:

- Consumers can handle errors consistently.
- The frontend does not need a different error parser for each endpoint.
- It makes the API easier to test and document.

### Pagination

Collection endpoints that can grow should use pagination.

Typical query params:

- `page`
- `limit`

Why:

- Returning every product or order at once does not scale.
- Pagination avoids slow responses and large payloads.
- It gives the frontend predictable data loading.

### Enums

Enums are used for fixed domain values.

Examples:

- Product status: `active`, `disabled`
- Order status: `pending`, `paid`, `processing`, `shipped`, `delivered`,
  `cancelled`
- Payment status: `pending`, `succeeded`, `failed`, `refunded`, `cancelled`
- Payment method: `payment_link`, `payment_intent`
- Discount type: `percentage`, `fixed_amount`

Why:

- They document allowed values.
- They make validation clearer.
- They help generated clients create stronger types.

## Common Review Questions

### What is the Week 2 deliverable?

The Week 2 deliverable is the OpenAPI contract for the T-Shirt Store API. It
defines the API that will be implemented in Week 3.

### Is this backend implementation?

No. Week 2 is API design. The backend implementation happens in Week 3, and it
should follow the OpenAPI contract.

### Why is OpenAPI treated as a contract?

Because consumers can build against it. If the backend changes a route, required
field, response field, auth rule, or status code later, it can break the
consumer.

### What would be a breaking change?

Examples:

- Renaming `currentStatus` to `status`.
- Changing `totalAmount` from number to string.
- Adding a new required request field.
- Changing `401` to `403` without a clear reason.
- Moving the JWT token from the `Authorization` header to somewhere else.

### What changes are usually safe?

Adding optional response fields is usually safe because existing consumers can
ignore them.

### Why are SKUs nested under products?

Because a SKU is a product variant. It does not make sense without its product,
and the product owns the size/color/price/stock variants.

### Why does order detail store address data?

Because the order needs a historical shipping snapshot. If the user edits their
address later, old orders should still show the address used at purchase time.

### Why not return only IDs everywhere?

Returning only IDs can create an N+1 problem for consumers. For example, if the
product list returned only `categoryId` and `imageId`, the frontend would need
extra calls for every product. Returning useful summary data makes the API more
consumer-friendly.

## Short Explanation To Memorize

```text
The Week 2 deliverable is the OpenAPI contract for the T-Shirt Store API. It
defines the REST resources, request bodies, response schemas, status codes,
authentication scheme, and role boundaries that the Week 3 NestJS
implementation should follow. The goal is to make the API predictable for
consumers before implementation starts.
```

