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

For project paths, modules, and commands, read `../reference.md`.

## Steps

1. Identify the endpoint, controller method, DTOs, and service (backend).
2. Identify the API client, TypeScript types, and consumer components (frontend).
3. Decide investigation depth before launching agents:
   - Investigate backend behavior when the API returns an incorrect response.
   - Investigate frontend behavior when a correct API response is mishandled.
   - Investigate both sides when a request/response contract changed or the mismatch source is unclear.
   - Confirm the counterpart contract even when only one side needs deeper investigation.
4. If both sides need deeper investigation, launch parallel sub-agents:
   - Backend agent: controller, DTOs, service, tests.
   - Frontend agent: API client, types, consumer components.
   - Consolidate before reporting.
5. Compare request fields:
   - Names, optional vs required, types (number/string/date).
   - Validation: `class-validator` decorators vs frontend form validation.
6. Compare response fields:
   - Names, nullable, arrays, nested objects.
   - Frontend assumptions about shape.
7. Compare error behavior:
   - HTTP status codes, error message shape.
   - Frontend fallback/display logic.
8. Cite every mismatch as `file:line` on both sides.
9. At the reporting step, load and fill `output-template.md`.

## Rules

- Do not assume frontend type is correct — verify against backend DTO/service.
- Do not assume backend is correct — verify against the user flow.
- Prefer small compatibility fix over broad refactor.
- Flag contract gaps even outside the current change.

## Output

Use `output-template.md`.
