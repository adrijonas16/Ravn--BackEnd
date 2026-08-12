# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A training-exercise repository for the **Node.js Nerdery Program**. It is **not an application** — there is no `src/`, no entry point, no build output, and no runtime server. Each file is a self-contained exercise whose spec lives in a block comment at the top of the file itself, followed by an unimplemented stub.

The work in this repo is almost always: _read the comment block, implement the stub directly below it, run the check for that module._ Read the challenge comment before editing — it lists explicit constraints (e.g. "no external libraries", "don't use `any` or `unknown`", "only work within the method in this file") that the code itself doesn't express.

## Working with Nerds on these exercises

**These are graded learning exercises.** The person you're helping is here to
build the skill, and a solution handed over is a rep they don't get. Default to
coaching rather than solving:

- **Explain the concept**, and point at the relevant docs and the constraints the
  challenge itself states.
- **Review and critique code they've already written** — that's the highest-value
  thing you can do here.
- **Give a hint or the next step**, not the finished implementation.
- **Don't fill a stub with a working solution** unless they explicitly ask you to.

If asked outright for the answer, offer to walk through the reasoning first. If
they still want it, give it — they're an adult and it's their call — but explain
what it does and why, rather than dropping code in silently.

Two things are always fair game, no hedging: **tooling problems** (a command
failing, a broken environment, a confusing stack trace) and **the meaning of a
challenge brief**. Those are friction, not the exercise.

## Commands

```bash
npm install                              # Node >= 22 required (engines field)

npm test                                 # jest — all specs
npm test -- 1-time-difference.spec.js    # single test (arg is a path regex)
npm run test:watch                       # watch mode

npm run lint                             # eslint .
npm run format                           # eslint --fix && prettier --write
npm run prettier                         # check only; printWidth 80, otherwise defaults

npx tsc --noEmit                         # type-check module 3 (rootDir is ./3-typescript)

cd 4-database && docker compose up       # Postgres 17 for module 4
```

**Lockfiles:** both `yarn.lock` and `package-lock.json` are committed, and the READMEs name **npm** as canonical. Note that `npm install` rewrites `yarn.lock` in place (npm syncs it when present) — if that shows up in `git status`, revert it rather than committing it.

## Module layout

Four numbered modules, each with its own README carrying module-specific instructions. The shared workflow — setup, commands, and the fork → branch → PR → mentor-review submission flow — lives once in the root `README.md`; sub-READMEs link to it rather than repeating it. Keep it that way when editing docs. Modules share only the root tooling — no cross-module imports.

| Module                                                 | Language          | How work is verified                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1-js-and-async-programming/1-javascript-fundamentals` | CommonJS JS       | **Jest** — the only module with tests. Each `N-name.js` has a paired `N-name.spec.js`; specs are given and should not be edited.                                                                                                                                                                               |
| `1-js-and-async-programming/2-asynchronous-js`         | CommonJS JS       | No tests. Files are run directly (`node 1-callback.js`) and self-invoke at the bottom. Helpers in `utils/` (`make-requests.js` fails ~90% of the time by design; `mocked-api.js` returns promises).                                                                                                            |
| `2-core-nodejs`                                        | —                 | README only, no starter code. The "Wishlist Tracker" CLI is built from scratch using **built-in modules only** (`fs`, `readline`, `process.argv`).                                                                                                                                                             |
| `3-typescript`                                         | TypeScript        | No tests. Verified by `tsc` type-checking. Data comes from `1-ecommerce/data/*.json`, read via `1-ecommerce/utils/read-json.util.ts` (`readJsonFile<T>` — the READMEs require using it). Stubs are typed `any`/`unknown` as placeholders and are meant to be replaced with real types defined in `1-types.ts`. |
| `4-database`                                           | SQL (Postgres 17) | No tests. Queries are written under `-- your query here` markers and run manually against the Docker database.                                                                                                                                                                                                 |

## Module 1 & 2 conventions

Exercise files use CommonJS (`require` / `module.exports`) — the fundamentals specs `require("./N-name")`, so the export shape must stay as authored (a bare function, not an object).

## Module 3 conventions

`tsconfig.json` has `rootDir: ./3-typescript` with `strict: true`, `module: commonjs`, and **no `outDir`** — running plain `tsc` emits `.js` files beside the sources. Use `--noEmit`. To execute a file, Node's type stripping needs `--experimental-strip-types` on Node 22 and works natively on Node 23+; the exercise files don't call their own functions, so nothing runs without adding a call.

There is no `ts-node` dependency, and the exercise files are scripts with no exports — nothing imports them.

## Module 4 setup

`docker compose up` from `4-database/` seeds `init.db/` in filename order: Pagila schema, Pagila data, then a separate `banking` schema for the transfer-funds exercise. Credentials are `postgres` / `pass_nerdery` on db `nerdery_db`, port 5432 — the compose file has a comment showing how to remap the host port if 5432 is taken. Init scripts only run on an empty volume, so re-seeding needs `docker compose down -v`.

Pagila lives in `public`; the banking exercise lives in schema `banking` and expects a function `banking.transfer_funds(from_id INT, to_id INT, amount NUMERIC)`. Seed rows for accounts 1–3 (including a `frozen` one) already exist.
