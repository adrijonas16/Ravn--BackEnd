# API Contract Check Output Template

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

Investigation decision:
- depth: backend/frontend/both
- reason: incorrect backend response / correct response mishandled / contract changed / mismatch unclear
- counterpart contract confirmed: yes/no — detail

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
