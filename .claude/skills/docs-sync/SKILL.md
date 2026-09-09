---
name: docs-sync
description: Check whether documentation matches a changed feature or module. Use this after implementation when API behavior, setup, commands, or developer workflows may need docs updates.
---

# Docs Sync

Use this skill after a code change or while reviewing a PR. The goal is to keep documentation aligned with the implementation without rewriting unrelated docs.

## Input

A changed feature, module, branch, or list of files. Include any known API endpoint, service, UI page, command, or behavior that changed.

Good inputs:

- "Sync docs for the cart quantity validation change."
- "Check whether the checkout API docs match the current payment flow."
- "Review docs affected by changes in the products admin page."

## Steps

1. Identify the changed behavior and the files that implement it.
2. Search for related documentation in:
   - `README.md`
   - `BackEnd/tshirt-store-api/**/README.md`
   - `BackEnd/tshirt-store-api/tshirt-api/docs`
   - `docs`
   - API examples or setup notes
3. Compare docs against the implementation and tests.
4. Update only documentation that is directly affected.
5. If no docs need changes, say so and explain why.
6. Record any docs that look outdated but are outside the current change.
7. Suggest a validation command when documentation references executable setup or checks.

## Rules

- Do not invent behavior that is not present in code or tests.
- Do not rewrite broad documentation for a small code change.
- Keep docs short, specific, and linked to actual commands or files.
- Do not include secrets, local tokens, or private environment values.

## Output

Return a documentation sync report in this format:

```text
Changed behavior:

Docs reviewed:
- ...

Docs updated:
- ...

No-change rationale:
- ...

Possible outdated docs outside scope:
- ...

Validation:
- ...
```

