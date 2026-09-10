---
name: api-contract-check
description: >
  Verify the contract between backend and frontend matches.
  Triggers: DTO changes, endpoint modifications, API client updates,
  "types don't match", "frontend gets wrong data", "backend returns unexpected shape",
  "request fails", "400 error", "422 error", "field missing in response".
  Catches request/response/error mismatches.
argument-hint: "[endpoint or DTO that changed]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Agent
---

# API Contract Check

Catch mismatches between NestJS API and React frontend before manual QA.

For project paths, modules, and commands, read `reference.md` in this skill's directory.

## Steps

1. Identify the endpoint, controller method, DTOs, and service (backend).
2. Identify the API client, TypeScript types, and consumer components (frontend).
3. If both sides need investigation, launch parallel sub-agents:
   - Backend agent: controller, DTOs, service, tests.
   - Frontend agent: API client, types, consumer components.
   - Consolidate before reporting.
4. Compare request fields:
   - Names, optional vs required, types (number/string/date).
   - Validation: `class-validator` decorators vs frontend form validation.
5. Compare response fields:
   - Names, nullable, arrays, nested objects.
   - Frontend assumptions about shape.
6. Compare error behavior:
   - HTTP status codes, error message shape.
   - Frontend fallback/display logic.
7. Cite every mismatch as `file:line` on both sides.

## Rules

- Do not assume frontend type is correct — verify against backend DTO/service.
- Do not assume backend is correct — verify against the user flow.
- Prefer small compatibility fix over broad refactor.
- Flag contract gaps even outside the current change.

## Output

```text
Contract checked:

Backend:
- endpoint: METHOD /path
- controller: file:line
- DTO: file:line
- service: file:line

Frontend:
- API client: file:line
- types: file:line
- consumers: file:line

Request contract:
- field: aligned/mismatch — detail

Response contract:
- field: aligned/mismatch — detail

Error contract:
- status/shape: aligned/mismatch — detail

Recommended fixes:
- file:line — change description

Follow-up issues:
- ...
```
