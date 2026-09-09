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
- No real database, Stripe, Redis, S3, email, or external payment service was used.
- Frontend and backend build checks were real local build checks.

Fresh-session skill runs:

- Planned invocation: `/investigate-task Investigate cart quantity validation. Direct CartService calls should reject non-positive and non-integer quantities before SKU/cart-item lookup.`
- Planned invocation: `/verify-change Verify the cart quantity validation fix in tshirt-api. Run the focused cart spec, full backend tests, backend build, backend lint, and relevant frontend lint/build checks.`
- Planned invocation: `/docs-sync Sync docs for the cart quantity validation change and confirm whether README or API docs need updates.`
- Planned invocation: `/api-contract-check Check the cart item quantity contract between frontend and backend.`
- The skills are repository-local and self-contained, so a fresh Claude Code session can invoke them without relying on this chat context.

Commits:

- `afb7298` - Add AI module skills and cart validation fix

## Limitations

- The invalid quantity and cart item stock response behavior are covered at the service unit level, not by an HTTP e2e test.
- Cart tests mock Prisma, so they validate service branching and repository calls, not database constraints.
- I did not run the application manually through the browser. The change is covered by targeted backend unit tests plus frontend/backend lint and build checks.
- The PR is open and pending mentor review.
