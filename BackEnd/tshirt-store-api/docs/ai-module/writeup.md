# AI Module - Write-Up

## Repository / PR

- **Repository**: [adrijonas16/Ravn--BackEnd](https://github.com/adrijonas16/Ravn--BackEnd)
- **Branch**: `ai-module-skills-assignment`
- **PR**: *(to be opened after review)*
- **Starting commit**: `4d1a0b8` — `fix: document pagination query params as numbers`

## Improvement: Cap cart quantities by available stock

**What changed**: The cart service (`cart.service.ts`) was not exposing the `stock` field in formatted cart items, so the frontend had no way to cap quantity selectors or show "out of stock" warnings. The fix adds `stock: item.productVariant.stock` to the `formatCart()` response, and the frontend uses it to disable quantity buttons when `qty >= stock`.

**How I know it works**:

- New test `should include available stock in formatted cart items` passes (`cart.service.spec.ts:81`).
- All 13 cart tests pass, including pre-existing stock validation tests.
- Frontend `CartPage.tsx` and `ProductDetailPage.tsx` use the `stock` field to cap quantity controls.

---

## Skills

| Skill (file link) | Goal, inputs -> steps -> output | Exact invocation |
|---|---|---|
| [`investigate-task`](.claude/skills/investigate-task/SKILL.md) | **Goal**: Turn a vague bug report into a scoped plan. **Input**: Bug description. **Steps**: (1) Restate expected vs actual, (2) determine scope (BE/FE/both), (3) launch parallel sub-agents if needed, (4) find similar working code, (5) compare, (6) form hypothesis, (7) test it, (8) produce plan. **Output**: Structured report with `file:line` references, root cause, implementation plan, and validation plan. | `/investigate-task the cart doesn't validate quantity against stock` |
| [`verify-change`](.claude/skills/verify-change/SKILL.md) | **Goal**: Produce executable evidence that a change works. **Input**: Description of what changed. **Steps**: (1) Run smallest targeted test, (2) if pass -> run broader checks (full tests -> build -> lint), (3) distinguish mocks vs real services, (4) record every command + exit code. **Output**: Pass/fail table with evidence, mock boundaries, and suggested commit message. | `/verify-change fixed stock validation in cart service` |
| [`db-check`](.claude/skills/db-check/SKILL.md) | **Goal**: Verify Prisma schema, migrations, and DTOs are in sync. **Input**: Model or field name. **Steps**: (1) Read schema.prisma, (2) `prisma validate`, (3) `prisma migrate status`, (4) compare fields vs DTOs, (5) check enums, (6) `npm run build`. **Output**: Schema vs DTO comparison table with mismatches. | `/db-check Product model` |
| [`security-check`](.claude/skills/security-check/SKILL.md) | **Goal**: Catch missing guards, leaked fields, unsafe patterns. **Input**: Endpoint or controller. **Steps**: (1) Check `@UseGuards`/`@Roles`, (2) check data exposure in response, (3) check input validation, (4) check frontend token handling, (5) check IDOR/mass assignment. **Output**: Per-endpoint security assessment. | `/security-check GET /orders/:id` |
| [`api-contract-check`](.claude/skills/api-contract-check/SKILL.md) | **Goal**: Verify BE DTOs and FE types agree. **Input**: Endpoint or DTO name. **Steps**: (1) Read controller + DTOs (BE), (2) read API client + types (FE) via parallel sub-agents, (3) compare request/response/error shapes. **Output**: Mismatch table with `file:line` on both sides. | `/api-contract-check cart endpoints` |
| [`test-coverage`](.claude/skills/test-coverage/SKILL.md) | **Goal**: Find untested critical paths. **Input**: Module name or "all". **Steps**: (1) Run `jest --coverage`, (2) read summary, (3) classify uncovered lines as critical/non-critical, (4) suggest test cases. **Output**: Coverage report + suggested tests. | `/test-coverage cart` |
| [`docs-sync`](.claude/skills/docs-sync/SKILL.md) | **Goal**: Keep docs aligned with implementation. **Input**: Feature that changed. **Steps**: (1) Identify changed behavior, (2) search READMEs/docs, (3) compare vs implementation, (4) update only affected docs. **Output**: List of docs reviewed/updated. | `/docs-sync cart stock validation` |
| [`env-check`](.claude/skills/env-check/SKILL.md) | **Goal**: Verify env vars are present and valid. **Input**: Service or variable. **Steps**: (1) Compare `.env` vs `.env.example`, (2) validate formats without exposing values, (3) test DB connectivity, (4) check Docker. **Output**: Missing vars + connectivity status. | `/env-check database` |

### Notes

- **Shared reference**: All skills read [`.claude/skills/reference.md`](.claude/skills/reference.md) for project paths, module list, auth architecture, and commands. This avoids duplicating project knowledge across 8 SKILL.md files.
- **CLAUDE.md**: Project-level instructions in [`CLAUDE.md`](../../CLAUDE.md) define working rules, available skills, and the pre-merge checklist. Skills reference it but do not duplicate it.
- **Reused tooling**: Skills use `allowed-tools` frontmatter to pre-approve tools (Read, Grep, Glob, Bash commands). This eliminates permission prompts during execution.
- **Dynamic context**: `investigate-task`, `verify-change`, `db-check`, `docs-sync`, and `env-check` use `!command` syntax to auto-load fresh data (git diff, prisma validate, etc.) before Claude reads the instructions.
- **Safety**: `db-check` explicitly forbids running `prisma migrate dev` without confirmation. `env-check` never prints secret values. `security-check` is read-only (no Bash tools). `verify-change` stops after 3 consecutive failures to prevent runaway patches.

---

## Project Results

### Before -> After

| Area | Before (manual) | After (with skills) |
|---|---|---|
| **Bug investigation** | Manually grep files, read service code, guess where the bug is. Trial-and-error fixes. | `/investigate-task` found `cart.service.ts:190` missing `stock` field in 4 phases: investigate -> analyze -> hypothesize -> plan. Cited `file:line` for every finding. |
| **Verification** | Run `npm test` manually, forget to check lint, skip frontend build. | `/verify-change` ran targeted cart tests (13/13 pass), then full suite (69/69 tests pass, 4 suites fail on pre-existing `@nestjs/bullmq` mock issue). Documented each command + exit code. |
| **Security review** | Forget to check guards on new endpoints, miss data leaks. | `/security-check` systematically checks `@UseGuards`, `@Roles`, `@Exclude`, input validation, IDOR, mass assignment per endpoint. |
| **DB schema sync** | Manually compare Prisma schema vs DTOs, miss mismatches. | `/db-check` runs `prisma validate` + `migrate status`, then compares every field against Create/Update DTOs with `file:line` citations. |
| **Human judgment still needed** | — | Deciding the scope of the fix (service-only vs also frontend), reviewing generated test mocks for accuracy, confirming the fix aligns with the product requirement. |

### Evidence

**Cart tests — 13/13 pass** (including the new stock test):

```
$ cd BackEnd/tshirt-store-api/tshirt-api
$ npm run test -- cart --runInBand

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Time:        18.678 s
```

Key tests:
- `addItem > should throw BadRequestException for insufficient stock` (pre-existing)
- `getOrCreateCart > should include available stock in formatted cart items` (NEW - added in fix)
- `updateItem > should throw BadRequestException when new quantity exceeds stock` (pre-existing)

**Full test suite — 69/69 tests pass**:

```
$ npm run test -- --runInBand

Test Suites: 4 failed, 8 passed, 12 total
Tests:       69 passed, 69 total
```

The 4 failing suites (`webhooks`, `products`, `notifications x2`) are pre-existing issues related to `@nestjs/bullmq` mock resolution and inventory model changes — unrelated to the cart fix.

**Mocks vs real services**:
- `PrismaService` is mocked in all tests (no real database).
- `cart.findFirst`, `productVariant.findUnique`, etc. are jest mocks.
- Integration test against real DB is not covered — noted as limitation.

**Fix commit**: [`16db4d0`](https://github.com/adrijonas16/Ravn--BackEnd/commit/16db4d0) — "Cap cart quantities by available stock"

Files changed:
- `cart.service.ts:190` — added `stock: item.productVariant.stock`
- `cart.service.spec.ts:80-113` — added test for stock in formatted items
- `tshirt-frontend/src/pages/CartPage.tsx` — quantity capped by stock
- `tshirt-frontend/src/pages/ProductDetailPage.tsx` — quantity capped by stock
- `tshirt-frontend/src/types/index.ts` — added `stock` field to CartItem type

### Limitations

- **Build fails**: The backend build has 83 TypeScript errors related to `InventoryMovement` model changes (pre-existing, unrelated to cart fix). The cart module compiles and tests correctly in isolation.
- **Integration tests**: All cart tests use mocked Prisma — no real database queries are tested. The `stock` field correctness depends on the Prisma query including `productVariant.stock` in the select, which is only verified structurally (not via integration test).
- **Frontend tests**: The React frontend has no test suite. Cart quantity capping in `CartPage.tsx` and `ProductDetailPage.tsx` is verified by build + lint only.
- **Coverage**: `jest --coverage` for the cart module reports 0% due to a `collectCoverageFrom` path resolution issue with the monorepo layout. The 13 passing tests cover the critical service logic.
- **Pre-existing failures**: 4 test suites fail due to `@nestjs/bullmq` mock issues and `InventoryMovement` schema changes. These are outside the scope of this assignment.
