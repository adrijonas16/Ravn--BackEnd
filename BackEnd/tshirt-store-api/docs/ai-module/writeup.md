# AI Module - Write-Up

## Repository / PR

- **Repository**: [adrijonas16/Ravn--BackEnd](https://github.com/adrijonas16/Ravn--BackEnd)
- **Branch**: `ai-module-skills-assignment`
- **PR**: [#1](https://github.com/adrijonas16/Ravn--BackEnd/pull/1)
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

#### Skill 1: `/investigate-task` — Finding the root cause

**Invocation**: `/investigate-task the cart getOrCreateCart response does not include stock info, so the frontend cannot cap quantity selectors`

**Output produced**:

```
Problem:
  Frontend quantity selectors have no stock limit — users can request more than available.
Expected behavior:
  Cart API response includes stock per item; frontend caps qty <= stock.
Actual behavior:
  formatCart() in cart.service.ts omits the stock field entirely.

Phase 1 — Investigation:
- cart.service.ts:180-193 — formatCart() maps item fields but skips stock
- cart.service.ts:77-78 — addItem() already validates stock (sku.stock < dto.quantity)
- cart.service.ts:136-138 — updateItem() already validates stock
- tshirt-frontend/src/types/index.ts — CartItem type has no stock field

Phase 2 — Analysis:
- Similar working implementation: cart.service.ts:77 validates stock in addItem()
  using sku.stock — the data IS queried, just not returned to the client.
- Key difference: addItem/updateItem use stock for validation but formatCart()
  doesn't expose it in the response.
- Root cause: cart.service.ts:190 — formatCart() omits stock field from response.

Phase 3 — Hypothesis:
- Hypothesis: Adding stock: item.productVariant.stock to formatCart() will
  expose stock to the frontend without changing any queries.
- Test: Check if the Prisma include in getOrCreateCart() already fetches stock.
- Result: CONFIRMED — the productVariant include fetches all fields including stock.

Phase 4 — Plan:
- Implementation:
  - cart.service.ts:190 — add `stock: item.productVariant.stock`
  - tshirt-frontend/src/types/index.ts — add `stock: number` to CartItem
  - CartPage.tsx — disable + button when qty >= stock
  - ProductDetailPage.tsx — cap quantity selector at stock
- Validation:
  - Add test: "should include available stock in formatted cart items"
  - Existing tests must still pass (addItem, updateItem stock checks)
- Risks:
  - None — additive change, no existing behavior modified
```

#### Skill 2: `/verify-change` — Proving the fix works

**Invocation**: `/verify-change the cart service now exposes stock field in formatted cart items`

**Output produced**:

```
Verification target: cart.service.ts:190 — stock field added to formatCart()

Commands run:
- command: npm run test -- cart --runInBand
  directory: BackEnd/tshirt-store-api/tshirt-api
  result: PASS
  evidence: Test Suites: 1 passed, 1 total | Tests: 13 passed, 13 total

- command: npm run test -- --runInBand
  directory: BackEnd/tshirt-store-api/tshirt-api
  result: PARTIAL (pre-existing failures)
  evidence: Tests: 69 passed, 69 total | Suites: 4 failed (bullmq), 8 passed

- command: npx eslint "src/cart/**/*.ts"
  directory: BackEnd/tshirt-store-api/tshirt-api
  result: PASS (exit code 0, no warnings)

- command: npx prisma validate
  directory: BackEnd/tshirt-store-api/tshirt-api
  result: PASS — "The schema at prisma/schema.prisma is valid"

Mocks vs real services:
- PrismaService: MOCKED (jest.fn() for all Prisma methods)
- cart.findFirst, productVariant.findUnique: jest mocks
- No real database, no real Stripe, no real S3

Result:
- PASS — 13/13 cart tests green, lint clean, schema valid
- Pre-existing: 4 suites fail on @nestjs/bullmq mock (unrelated)

Limitations:
- Integration test against real DB not covered
- Frontend has no test suite — verified by build + lint only
- npm run build has 83 pre-existing TS errors (InventoryMovement model)

Recommended commit message:
  "Cap cart quantities by available stock"
```

#### Skill 3: `/db-check` — Verifying schema alignment

**Invocation**: `/db-check cart and product variant models`

**Output produced**:

```
Models checked: Cart, CartItem, ProductVariant

Schema validation:
- prisma validate: PASS — "The schema at prisma/schema.prisma is valid"

Migration status:
- status: database unreachable (Docker not running)
- note: tests use mocked Prisma, not a real DB connection

Schema vs DTOs:
- CartItem.quantity (schema) vs AddToCartDto.quantity (dto)
  - aligned — both required Int
- ProductVariant.stock (schema) vs formatCart() response (service)
  - aligned AFTER fix — cart.service.ts:190 now exposes stock

Schema vs Services:
- cart.service.ts:77 reads sku.stock for validation — aligned
- cart.service.ts:190 returns stock in formatCart() — aligned AFTER fix

Recommended actions:
- None — schema, DTOs, and services are aligned for the cart module
```

#### Skill 4: `/security-check` — Checking cart endpoints

**Invocation**: `/security-check cart endpoints`

**Output produced**:

```
Scope checked:
- cart.controller.ts — all cart endpoints

Auth guards:
- All cart endpoints: @UseGuards(JwtAuthGuard) present
- @Roles(): uses @CurrentUser() for user scoping — clients access own cart only

Data exposure:
- formatCart() response: no passwords, no tokens, no hashes
- stock field: safe to expose (public product info)
- user data: not included in cart response

Input validation:
- AddToCartDto: @IsInt() quantity, @IsPositive(), @IsInt() productVariantId
- UpdateCartItemDto: @IsInt() quantity, @IsPositive()
- Path params: use ParseIntPipe

Vulnerabilities found:
- None in cart module — ownership enforced via userId from JWT
```

#### Skill 5: `/env-check` — Environment verification

**Invocation**: `/env-check database`

**Output produced**:

```
Environment checked:

Format validation:
- DATABASE_URL: valid (starts with postgresql://)
- JWT_SECRET: present
- STRIPE_SECRET_KEY: present (sk_test_*)

Service connectivity:
- database: FAILED — P1001: Can't reach database server at 127.0.0.1:5434
- docker: not running (postgres container stopped)
- note: all tests use mocked Prisma, DB not required for test suite

Recommended actions:
- Start Docker postgres: docker start postgres_nerdery
- Or: docker compose up -d
```

#### Fix commit and files changed

**Fix commit**: [`16db4d0`](https://github.com/adrijonas16/Ravn--BackEnd/commit/16db4d0) — "Cap cart quantities by available stock"

Files changed:
- `cart.service.ts:190` — added `stock: item.productVariant.stock`
- `cart.service.spec.ts:80-113` — added test for stock in formatted items
- `tshirt-frontend/src/pages/CartPage.tsx` — quantity capped by stock
- `tshirt-frontend/src/pages/ProductDetailPage.tsx` — quantity capped by stock
- `tshirt-frontend/src/types/index.ts` — added `stock` field to CartItem type

#### Key stock validation code (cart.service.ts)

```
 77: // Verifica stock antes de agregar
 78: if (sku.stock < dto.quantity) {
 80:   `Insufficient stock (available: ${sku.stock})`,
 99:   if (newQty > sku.stock) {
101:     `Insufficient stock (available: ${sku.stock}, in cart: ${existingItem.quantity})`,
136: if (dto.quantity > item.productVariant.stock) {
138:   `Insufficient stock (available: ${item.productVariant.stock})`,
190: stock: item.productVariant.stock,  // <-- THE FIX: expose stock to frontend
```

### Limitations

- **Build fails**: The backend build has 83 TypeScript errors related to `InventoryMovement` model changes (pre-existing, unrelated to cart fix). The cart module compiles and tests correctly in isolation.
- **Integration tests**: All cart tests use mocked Prisma — no real database queries are tested. The `stock` field correctness depends on the Prisma query including `productVariant.stock` in the select, which is only verified structurally (not via integration test).
- **Frontend tests**: The React frontend has no test suite. Cart quantity capping in `CartPage.tsx` and `ProductDetailPage.tsx` is verified by build + lint only.
- **Coverage**: `jest --coverage` for the cart module reports 0% due to a `collectCoverageFrom` path resolution issue with the monorepo layout. The 13 passing tests cover the critical service logic.
- **Pre-existing failures**: 4 test suites fail due to `@nestjs/bullmq` mock issues and `InventoryMovement` schema changes. These are outside the scope of this assignment.
