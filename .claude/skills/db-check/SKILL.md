---
name: db-check
description: Verify that Prisma schema, migrations, and DTOs are in sync. Use this after changing database models, adding fields, or modifying relations.
---

# DB Check

Use this skill when a change touches the database layer. The goal is to catch schema drift, missing migrations, and DTO mismatches before they reach runtime.

## Input

A changed model, field, relation, migration, or DTO. Include any known table, column, or Prisma model name.

Good inputs:

- "Check if the new `discount` field on Order is reflected in DTOs and migrations."
- "Check whether the product variant schema matches the create-variant DTO."
- "Check migration status after adding the `promoCode` relation."

## Working Directories

- Backend commands run from: `BackEnd/tshirt-store-api/tshirt-api`
- Prisma schema: `BackEnd/tshirt-store-api/tshirt-api/prisma/schema.prisma`
- Migrations: `BackEnd/tshirt-store-api/tshirt-api/prisma/migrations/`

Always `cd` to the backend directory before running any command.

## Steps

1. Read the relevant models in `prisma/schema.prisma`.
2. Run `npx prisma validate` to check schema syntax.
3. Run `npx prisma migrate status` to detect pending or failed migrations.
4. Compare schema fields against:
   - Create DTOs (`create-*.dto.ts`)
   - Update DTOs (`update-*.dto.ts`)
   - Response DTOs or serialized outputs
   - Service methods that read/write the model
5. Check for:
   - Fields in schema but missing from DTOs (data not exposed or not accepted).
   - Fields in DTOs but missing from schema (will fail at runtime).
   - Enum mismatches between Prisma enums and TypeScript enums/types.
   - Relation fields without proper `@relation` or cascade rules.
   - Optional vs required mismatches (`?` in Prisma vs `@IsOptional()` in DTO).
6. If a migration is needed, note it but do not run `migrate dev` without asking.
7. Run `npm run build` to catch compile-time type errors.

## Rules

- Do not run `npx prisma migrate dev` or `npx prisma db push` without user confirmation. These modify the database.
- Do not assume a field is unused just because it is missing from a DTO. Check service code first.
- Prefer adding missing DTO fields over removing schema fields.

## Output

Return a database sync report in this format:

```text
Models checked:

Schema validation:
- prisma validate: pass/fail

Migration status:
- status: up to date / pending / failed
- details: ...

Schema vs DTOs:
- model: ...
  - aligned/mismatch: ...
  - details: ...

Schema vs Services:
- ...

Enum alignment:
- ...

Recommended actions:
- ...

Commands to run:
- ...
```
