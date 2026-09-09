---
name: security-check
description: Check that a code change does not introduce security vulnerabilities. Use this when adding endpoints, modifying auth, or changing data exposure.
---

# Security Check

Use this skill when a change touches authentication, authorization, data exposure, or adds new endpoints. The goal is to catch missing guards, leaked fields, and unsafe patterns before they reach production.

## Input

A changed endpoint, controller, service, guard, or frontend page that handles sensitive data.

Good inputs:

- "Check security on the new admin product delete endpoint."
- "Check whether the order response leaks payment details."
- "Check that the new delivery endpoint requires the correct role."

## Working Directories

- Backend commands run from: `BackEnd/tshirt-store-api/tshirt-api`
- Frontend commands run from: `BackEnd/tshirt-store-api/tshirt-frontend`

Always `cd` to the correct directory before running any command.

## Project Auth Architecture

- Guards: `JwtAuthGuard`, `RolesGuard` (in `src/auth/guards/`)
- Decorators: `@Roles()`, `@CurrentUser()`, `@Public()`
- Roles: `manager`, `client`, `delivery_person`
- Strategy: JWT via Passport (`src/auth/strategies/`)
- CASL ability factory: `src/casl/`

## Steps

1. Identify the changed or new endpoint (controller method).
2. Check that the endpoint has the correct guards:
   - `@UseGuards(JwtAuthGuard, RolesGuard)` or applied globally.
   - `@Roles()` decorator with the correct role(s).
   - If intentionally public, `@Public()` decorator must be explicit.
3. Check data exposure in responses:
   - Passwords, tokens, or hashes must never appear in responses.
   - Internal IDs or sensitive fields (email, address) should only appear when the user owns the data or is a manager.
   - Use `class-transformer` `@Exclude()` or manual selection to strip fields.
4. Check input validation:
   - DTOs should use `class-validator` decorators (`@IsString()`, `@IsInt()`, `@Min()`, etc.).
   - No raw user input should reach SQL, shell, or file system operations.
   - `ParseIntPipe`, `ParseUUIDPipe`, or equivalent should validate path/query params.
5. Check frontend token handling:
   - Tokens stored in `localStorage` or `httpOnly` cookies (not in URL params or non-http cookies).
   - Auth headers sent only to the app's own API, not to third parties.
   - Token refresh or expiry handled gracefully.
6. Check for common vulnerabilities:
   - Mass assignment: accepting unknown fields via spread operator on create/update.
   - IDOR: accessing resources by ID without verifying ownership.
   - Missing rate limiting on auth endpoints (login, forgot-password).
7. Run `npm run build` and `npm run test -- --runInBand` to verify nothing breaks.

## Rules

- Do not remove guards or weaken validation to fix build errors.
- Do not assume an endpoint is internal-only unless it is explicitly unreachable from the frontend.
- Flag issues even if they exist in code you did not change, as long as they relate to the current flow.
- Prefer the principle of least privilege: restrict access by default.

## Output

Return a security report in this format:

```text
Scope checked:

Auth guards:
- endpoint: ...
  - guard: present/missing
  - roles: correct/incorrect/missing
  - notes: ...

Data exposure:
- endpoint/response: ...
  - sensitive fields: none/leaked
  - details: ...

Input validation:
- DTO/param: ...
  - validated: yes/no
  - details: ...

Frontend token handling:
- storage: ...
- transmission: ...
- issues: ...

Vulnerabilities found:
- ...

Recommended fixes:
- ...
```
