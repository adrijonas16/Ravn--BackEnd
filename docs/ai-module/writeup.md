# AI Module - Write-Up

## Repository / PR

- Repository: `Ravn--BackEnd`
- Branch: `ai-module-skills-assignment`
- PR: https://github.com/adrijonas16/Ravn--BackEnd/pull/1
- Starting commit: `4d1a0b81cf539b7008a62940a05ca4214cb142fa`

## Improvement

The cart quantity flow is now safer and clearer across backend and frontend.

- The cart service rejects non-positive and non-integer item quantities inside the service layer for both add and update operations.
- Cart API responses now include each item's available `stock`.
- Product detail quantity controls now stop at the selected SKU stock.
- Cart quantity controls now stop at each cart item's available stock and disable the `+` button at the limit.
- Store buttons now share the same base font size, so `Pay now` matches the surrounding button typography.

Before this change, controller DTO validation had `@Min(1)`, but direct service calls could still reach inconsistent paths:

- `addItem` with quantity `0` looked up the SKU and returned `NotFoundException` in the unit reproduction.
- `updateItem` with quantity `0` could continue into cart lookup and produced a `TypeError` in the unit reproduction when no cart mock was present.

After this change, both service methods return `BadRequestException('Quantity must be a positive integer')` before reading SKU/cart item data. The backend also exposes `stock` in formatted cart items so the frontend can enforce the same limit before calling the API. It works because the focused cart unit tests now cover zero, negative, decimal quantities, and cart item stock output, and the full backend/frontend checks pass.

## Skills

| Skill (file link) | Goal, inputs -> steps -> output | Exact invocation |
| --- | --- | --- |
| [investigate-task](../../.claude/skills/investigate-task/SKILL.md) | Goal: investigate a bug or improvement before implementation. Input: bug report/proposed change. Steps: restate behavior, inspect relevant files, identify frontend/backend scope, find tests/checks, propose reproduction, plan implementation and validation. Output: relevant files, current behavior, proposed change, test plan, risks, rollback notes, next command. | `/investigate-task Investigate cart quantity validation. Direct CartService calls should reject non-positive and non-integer quantities before SKU/cart-item lookup.` |
| [verify-change](../../.claude/skills/verify-change/SKILL.md) | Goal: verify a completed change with executable checks. Input: changed files or branch. Steps: run targeted checks, report failures, run broader backend/frontend checks, distinguish mocks vs real services, record evidence. Output: command results, evidence logs, mocked vs real services, limitations, recommended commit message. | `/verify-change Verify the cart quantity validation fix in tshirt-api. Run the focused cart spec, full backend tests, backend build, backend lint, and relevant frontend lint/build checks.` |
| [docs-sync](../../.claude/skills/docs-sync/SKILL.md) | Goal: keep documentation aligned with implementation. Input: changed feature/module/files. Steps: identify changed behavior, search related docs, compare docs to code/tests, update only affected docs or explain why none are needed. Output: docs reviewed, docs updated, no-change rationale, possible outdated docs, validation. | `/docs-sync Sync docs for the cart quantity validation change and confirm whether README or API docs need updates.` |
| [api-contract-check](../../.claude/skills/api-contract-check/SKILL.md) | Goal: check full-stack API alignment. Input: endpoint, frontend flow, DTO, service method, or branch. Steps: compare backend controller/DTO/service behavior with frontend API clients, types, consumers, and error handling. Output: backend/frontend files reviewed, request/response/error alignment, recommended checks, follow-up issues. | `/api-contract-check Check the cart item quantity contract between frontend and backend.` |
| [db-check](../../.claude/skills/db-check/SKILL.md) | Goal: verify Prisma schema, migrations, DTOs, and service usage stay aligned. Input: model or field. Steps: validate schema, check migration status, compare schema fields to DTOs and service reads/writes. Output: schema validation, migration status, mismatches, recommended actions. | `/db-check Check cart, cart item, and product variant stock alignment.` |
| [security-check](../../.claude/skills/security-check/SKILL.md) | Goal: check endpoint auth, input validation, and data exposure. Input: endpoint/controller. Steps: inspect guards, roles, response fields, DTO validation, frontend token handling, IDOR/mass-assignment risks. Output: scoped security findings and recommended fixes. | `/security-check Check cart endpoints after exposing stock in cart responses.` |
| [test-coverage](../../.claude/skills/test-coverage/SKILL.md) | Goal: find critical untested paths. Input: module or full backend. Steps: run targeted coverage, identify uncovered lines, classify critical vs non-critical, suggest tests. Output: coverage summary, uncovered paths, suggested test cases, mock boundaries. | `/test-coverage Check cart service coverage for quantity validation and stock response output.` |
| [env-check](../../.claude/skills/env-check/SKILL.md) | Goal: verify environment variables and service connectivity without exposing secrets. Input: service or variable. Steps: compare `.env.example` and `.env`, validate formats, test DB connectivity, check Docker if needed. Output: missing/extra variables, format validation, connectivity, recommended actions. | `/env-check Check database environment for API verification.` |

## Notes

- References used: local course guidance on Agent Skills, feedback loops, red-green-refactor, and Ralph/HITL vs AFK workflows.
- Reused project tooling:
  - Backend unit tests: `npm run test -- cart.service.spec.ts --runInBand`
  - Backend full tests: `npm run test -- --runInBand`
  - Backend lint without auto-fix: `npx eslint "{src,apps,libs,test}/**/*.ts"`
  - Backend build: `npm run build`
  - Frontend lint: `npm run lint`
  - Frontend build: `npm run build`
- Setup added: [CLAUDE.md](../../CLAUDE.md) documents project paths and common checks for future Claude Code sessions.
- `.gitignore` was updated so `.claude/skills/**/SKILL.md` can be committed while other `.claude` local files stay ignored.
- Safety/rollback: rollback is limited to the cart service guard, cart response shape, frontend cart/product quantity controls, button typography CSS, skill files, `CLAUDE.md`, `.gitignore`, and this write-up. No shared data, credentials, migrations, or external services were changed.

## Project Results

### Before -> after

- Manual workflow before: remember to inspect DTOs, service methods, tests, and manually decide which checks to run.
- Skill-assisted workflow after:
  - `/investigate-task` turns a vague improvement into relevant files, a controlled failing reproduction, and a small implementation plan.
  - `/verify-change` standardizes the validation sequence and records evidence instead of relying on memory.
  - `/docs-sync` checks whether the change affects documentation and keeps that review explicit.
  - `/api-contract-check` gives a repeatable way to compare backend DTO/service behavior with frontend API clients and types when a change crosses the API boundary.

The judgment I still needed: choosing a change small enough for the assignment, deciding that service-layer validation was worthwhile even though controller DTO validation already existed, broadening the invariant from "at least 1" to "positive integer" to match DTO intent, exposing stock to the frontend instead of duplicating product lookup logic there, and choosing unit tests/build checks rather than a heavier e2e flow.

### Evidence

Starting commit:

```text
4d1a0b81cf539b7008a62940a05ca4214cb142fa
```

Baseline checks:

```text
npm run test -- --runInBand
Test Suites: 12 passed, 12 total
Tests: 94 passed, 94 total
```

```text
npm run build
tshirt-frontend: built successfully
```

Controlled failing check after adding reproduction tests and before the fix:

```text
npm run test -- cart.service.spec.ts --runInBand
FAIL src/cart/cart.service.spec.ts
CartService > addItem > should reject quantities below one before looking up the SKU
Expected constructor: BadRequestException
Received constructor: NotFoundException

CartService > updateItem > should reject quantities below one before reading the cart item
Expected constructor: BadRequestException
Received constructor: TypeError
```

Passing focused check after the fix:

```text
npm run test -- cart.service.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests: 13 passed, 13 total
```

Passing HTTP/API check after adding stock response evidence:

```text
npm run test:e2e -- --runInBand -t "should add a SKU to the cart"
Test Suites: 1 passed, 1 total
Tests: 1 passed, 16 skipped, 17 total
Evidence: POST /api/v1/cart/items returned the seeded SKU with stock: 100.
```

Passing broader checks after the fix:

```text
npm run test -- --runInBand
Test Suites: 12 passed, 12 total
Tests: 101 passed, 101 total
```

```text
npm run build
tshirt-api: nest build passed
```

```text
npx eslint "{src,apps,libs,test}/**/*.ts"
backend lint passed with no output
```

```text
npm run lint
tshirt-frontend: oxlint passed
```

```text
npm run build
tshirt-frontend: vite build passed
```

Mocks versus real services:

- Cart tests use Jest mocks for `PrismaService`.
- The focused HTTP e2e check used the real local PostgreSQL test schema through Supertest.
- No Stripe, S3, email, or external payment service was used.
- Frontend and backend build checks were real local build checks.

Fresh-session skill run evidence:

- `/investigate-task`
  - Input: cart quantity validation should reject non-positive and non-integer service calls before SKU/cart-item lookup.
  - Result: identified backend service validation plus frontend stock-cap behavior as the scope; proposed focused failing unit tests for `addItem` and `updateItem`, then broader backend/frontend checks.
  - Supporting output: reproduction tests failed before the fix with `NotFoundException` for `addItem(0)` and `TypeError` for `updateItem(0)`, then passed after adding `validateQuantity()`.
  - Gap: no code was changed by the investigation run; it produced the implementation and validation plan.

- `/verify-change`
  - Input: verify cart quantity validation and cart item `stock` response behavior.
  - Result: targeted cart service tests passed, HTTP e2e stock response check passed, then full backend tests, backend build, backend lint, frontend lint, and frontend build passed.
  - Supporting output: `npm run test -- cart.service.spec.ts --runInBand` passed 13 tests; `npm run test:e2e -- --runInBand -t "should add a SKU to the cart"` passed 1 focused HTTP test and asserted `stock: 100`; `npm run test -- --runInBand` passed 101 tests; `npm run build` passed for `tshirt-api`; backend ESLint passed with no output; frontend `npm run lint` and `npm run build` passed.
  - Behavior evidence: service unit tests prove zero, negative, and decimal quantities are rejected before repository lookups and prove formatted cart items include `stock: 40`.
  - HTTP/API evidence: the existing Supertest e2e checkout flow now asserts the cart API returns `stock` for the seeded SKU.
  - Browser/UI evidence: frontend `npm run build` and `npm run lint` pass; code inspection confirms `CartPage.tsx` caps updates with `Math.min(item.stock, quantity)` and disables `+` at `item.quantity >= item.stock`; `ProductDetailPage.tsx` derives `maxQuantity` from `selectedSku.stock`, caps increment clicks, and clamps quantity again when SKU changes.
  - Browser/UI gap: no browser automation artifact was captured because the frontend project has no browser test harness. The updated `verify-change` skill now requires a browser check for these interactions when that harness is available.

- `/docs-sync`
  - Input: sync docs for the cart quantity validation and stock response change.
  - Result: reviewed project docs for affected API/setup behavior and updated this write-up as the assignment artifact; no product README behavior changes were required.
  - Supporting output: docs reviewed included backend README/API docs locations and `docs/ai-module/writeup.md`.
  - Gap: the original dynamic context used an arbitrary `HEAD~3` window. The revised skill requires a task-tied baseline, labels the file-list comparison, and reports a missing baseline instead of treating empty output as no changes.

- `/api-contract-check`
  - Input: cart item quantity contract between backend and frontend.
  - Result: confirmed backend request validation and service validation align with frontend quantity controls; confirmed response alignment requires `stock` in formatted cart items and `CartItem.stock` in frontend types.
  - Supporting output: backend evidence came from `cart.service.ts`, `cart.service.spec.ts`, and the focused Supertest e2e assertion for `stock: 100`; frontend evidence came from `src/types/index.ts`, `CartPage.tsx`, and `ProductDetailPage.tsx`.
  - Gap: the output template lived inline in the skill. It is now extracted to `api-contract-check/output-template.md` and loaded at report time.

- `/db-check`
  - Input: cart item quantity and product variant stock alignment.
  - Result: Prisma schema, DTO quantity fields, and service stock checks were reviewed as aligned for this change.
  - Supporting output: `npx prisma validate` is the expected schema syntax check; real migration status depends on the local database being available.
  - Gap: no migration was needed for this change.

- `/security-check`
  - Input: cart endpoints after exposing `stock`.
  - Result: cart endpoints remain JWT-scoped to the current user; exposing `stock` is not sensitive because product stock is catalog data.
  - Supporting output: cart controller uses the authenticated current user, and formatted cart responses do not include passwords, tokens, hashes, or other user data.
  - Gap: no rate-limit or broader auth architecture changes were part of this task.

- `/test-coverage`
  - Input: cart service quantity validation and stock response output.
  - Result: identified focused unit coverage as the right evidence for the service invariant.
  - Supporting output: cart service spec covers invalid quantities, insufficient stock, and stock output in formatted cart items.
  - Gap: coverage is service-level with mocked Prisma, not a real database integration test.

- `/env-check`
  - Input: database environment for potential API verification.
  - Result: confirms what must be available before real HTTP or database checks can run.
  - Supporting output: the skill validates required env formats without printing secret values and uses Prisma migration status for DB connectivity.
  - Gap: the original verification did not capture a successful real-database run.

Commits:

- `afb7298` - Add AI module skills and cart validation fix

## Limitations

- The cart API stock response is now covered by a focused HTTP e2e assertion, but browser behavior is still verified by source inspection plus frontend lint/build rather than browser automation.
- Cart tests mock Prisma, so they validate service branching and repository calls, not database constraints.
- The PR is open and pending mentor review.
