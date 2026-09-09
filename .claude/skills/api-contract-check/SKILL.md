---
name: api-contract-check
description: Check that frontend API clients, shared types, backend DTOs, controllers, and service behavior agree. Use this when an API request/response shape changes or when a frontend flow depends on backend behavior.
---

# API Contract Check

Use this skill when a change touches or depends on the contract between the NestJS API and the React frontend. The goal is to catch mismatches before they reach manual QA.

## Input

An endpoint, frontend flow, DTO, service method, or PR/branch that may affect API behavior.

Good inputs:

- "Check the cart item quantity contract between frontend and backend."
- "Check whether promo code preview response matches the frontend types."
- "Check the admin products API contract after changing variant fields."

## Steps

1. Identify the backend endpoint, controller method, DTOs, and service method.
2. Identify the frontend API client, TypeScript types, and pages/components that consume it.
3. Compare request fields:
   - names
   - optional vs required
   - number/string/date conversions
   - validation rules
4. Compare response fields:
   - names
   - nullable values
   - arrays and nested objects
   - frontend assumptions
5. Check error behavior:
   - status class
   - message shape
   - frontend fallback message
6. Recommend focused tests or checks for any mismatch.
7. Run only relevant checks if asked to verify the change.

## Repository Map

- Backend controllers and DTOs: `BackEnd/tshirt-store-api/tshirt-api/src/**`
- Backend OpenAPI setup: `BackEnd/tshirt-store-api/tshirt-api/src/create-app.ts`
- Frontend API clients: `BackEnd/tshirt-store-api/tshirt-frontend/src/api`
- Frontend domain types: `BackEnd/tshirt-store-api/tshirt-frontend/src/types`
- Frontend pages: `BackEnd/tshirt-store-api/tshirt-frontend/src/pages`

## Checks To Consider

- Backend focused test: `npm run test -- <spec-file> --runInBand`
- Backend build: `npm run build`
- Frontend lint: `npm run lint`
- Frontend build: `npm run build`

## Rules

- Do not assume the frontend type is correct; verify it against backend DTO/service behavior.
- Do not assume the backend behavior is correct; verify it against the user flow.
- Prefer a small compatibility fix over a broad refactor.
- Call out contract gaps even if they are outside the current change.

## Output

Return an API contract report in this format:

```text
Contract checked:

Backend:
- endpoint:
- controller:
- DTO/service:

Frontend:
- API client:
- types:
- consumers:

Request contract:
- aligned/mismatch:

Response contract:
- aligned/mismatch:

Error contract:
- aligned/mismatch:

Recommended checks:
- ...

Follow-up issues:
- ...
```

