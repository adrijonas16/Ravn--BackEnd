---
name: security-check
description: >
  Check for missing guards, leaked fields, and unsafe patterns in endpoints.
  Triggers: "new endpoint", "check guards", "is this secure", "leaked data",
  "missing auth", "role check", "IDOR", "mass assignment", "password in response",
  "token handling", "rate limiting".
  Covers auth, validation, and data exposure.
argument-hint: "[endpoint or controller to check]"
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Security Check

Catch missing guards, leaked fields, and unsafe patterns before production.

For project paths, auth architecture, and commands, read `reference.md` in this skill's directory.

## Steps

1. Identify the changed/new endpoint (controller method) — cite `file:line`.
2. Check auth guards:
   - `@UseGuards(JwtAuthGuard, RolesGuard)` or global guard applied.
   - `@Roles()` decorator with correct role(s).
   - If intentionally public, `@Public()` must be explicit.
3. Check data exposure in responses:
   - Passwords, tokens, hashes must never appear.
   - Internal IDs or sensitive fields only when user owns data or is manager.
   - `@Exclude()` or manual field selection to strip fields.
4. Check input validation:
   - DTOs use `class-validator` decorators.
   - No raw user input reaches SQL, shell, or file system.
   - `ParseIntPipe`, `ParseUUIDPipe` validate path/query params.
5. Check frontend token handling:
   - Tokens in `localStorage` or `httpOnly` cookies, not URL params.
   - Auth headers sent only to app's own API.
   - Token refresh/expiry handled.
6. Check common vulnerabilities:
   - Mass assignment: accepting unknown fields via spread on create/update.
   - IDOR: accessing resources by ID without ownership check.
   - Missing rate limiting on auth endpoints.
7. Cite all findings with `file:line`.

## Rules

- Never remove guards or weaken validation to fix build errors.
- Never assume an endpoint is internal-only unless explicitly unreachable.
- Flag issues even in unchanged code if they relate to the current flow.
- Principle of least privilege: restrict by default.

## Output

```text
Scope checked:
- file:line — endpoint/change description

Auth guards:
- endpoint (file:line): guard present/missing, roles correct/incorrect/missing

Data exposure:
- response (file:line): sensitive fields none/leaked — detail

Input validation:
- DTO (file:line): validated yes/no — detail

Frontend token handling:
- storage: method — secure/insecure
- transmission: detail

Vulnerabilities found:
- type (file:line) — detail

Recommended fixes:
- file:line — change description
```
