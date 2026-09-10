---
name: db-check
description: >
  Verify Prisma schema, migrations, and DTOs are in sync.
  Triggers: "schema change", "add field", "new model", "migration", "prisma",
  "DTO doesn't match schema", "missing column", "relation error",
  "prisma validate", "migrate status".
  Catches schema drift and field mismatches.
argument-hint: "[model or field that changed]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(npx prisma validate)
  - Bash(npx prisma migrate status)
  - Bash(npm run build)
---

# DB Check

Catch schema drift, missing migrations, and DTO mismatches before runtime errors.

For project paths, modules, and commands, read `reference.md` in this skill's directory.

## Dynamic Context

!`cd BackEnd/tshirt-store-api/tshirt-api && npx prisma validate 2>&1 | tail -5 || true`

## Steps

1. Read relevant models in `prisma/schema.prisma` — cite `file:line`.
2. Run `npx prisma validate` to check schema syntax.
3. Run `npx prisma migrate status` to detect pending/failed migrations.
4. Compare schema fields against:
   - Create DTOs (`create-*.dto.ts`) — cite `file:line`.
   - Update DTOs (`update-*.dto.ts`) — cite `file:line`.
   - Response DTOs or serialized outputs.
   - Service methods that read/write the model.
5. Check for:
   - Fields in schema but missing from DTOs.
   - Fields in DTOs but missing from schema (runtime failure).
   - Enum mismatches (Prisma enum vs TypeScript enum/type).
   - Relation fields without `@relation` or cascade rules.
   - Optional vs required (`?` in Prisma vs `@IsOptional()` in DTO).
6. If migration needed, note it but do NOT run `migrate dev` without asking.
7. Run `npm run build` to catch Prisma client type errors.

## Rules

- NEVER run `prisma migrate dev` or `prisma db push` without user confirmation.
- Do not assume a field is unused — check service code first.
- Prefer adding missing DTO fields over removing schema fields.
- Cite all findings with `file:line`.

## Output

```text
Models checked:

Schema validation:
- prisma validate: pass/fail

Migration status:
- status: up to date / pending / failed

Schema vs DTOs:
- model.field (schema.prisma:line) vs DTO (file:line)
  - aligned/mismatch — detail

Schema vs Services:
- model.field (schema.prisma:line) vs service (file:line)

Enum alignment:
- PrismaEnum vs TypeScriptEnum — aligned/mismatch

Recommended actions:
- ...
```
