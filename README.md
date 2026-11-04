# Full-stack auth module

Sign up, sign in, a protected page and logout, built with Next.js 16 (React, TypeScript) and NestJS 12 on MongoDB 8.
The browser only talks to the web app; it proxies `/api/*` to the API, and the session lives in an httpOnly cookie.

## Prerequisites

- Node.js 24 (`.nvmrc`)
- pnpm 10.33 (`corepack enable` picks up the version pinned in `package.json`)
- Docker (runs the local MongoDB)

## Setup

```bash
git clone https://github.com/jrmoha/full-stack-auth-module.git
cd full-stack-auth-module
pnpm install

# API env: copy the example, then replace JWT_SECRET (the example value is refused at boot)
cp apps/api/.env.example apps/api/.env
openssl rand -hex 32   # paste the output as JWT_SECRET in apps/api/.env

# Web env: one server-only variable
cp apps/web/.env.example apps/web/.env.local
```

Every variable is described in [`docs/architecture.md` §7](docs/architecture.md#7-environments--deploy). The API and
the web app both refuse to start with a missing or invalid variable and name it (never its value).

## Run

```bash
pnpm dev
```

This starts MongoDB 8 in Docker (host port 27018), waits for it to be healthy, then runs both apps:

| What                                 | URL                        |
| ------------------------------------ | -------------------------- |
| Web app                              | http://localhost:3000      |
| API                                  | http://localhost:4000      |
| API docs (Swagger, development only) | http://localhost:4000/docs |

Open http://localhost:3000, create an account, and you land on the protected page ("Welcome to the application.").

## Test

```bash
docker compose up -d --wait mongo     # tests use the auth_test database in the same container
pnpm test                             # Vitest: API (unit + integration, real MongoDB) and web (unit)

pnpm --filter web exec playwright install chromium   # once
pnpm e2e                              # Playwright against production builds of both apps
```

Tests connect only through `TEST_MONGODB_URI` (in `apps/api/.env`); they refuse to run unless the database name ends
in `_test`, and they only ever delete documents. The e2e run builds both apps and starts them on ports 4200 and 3200,
so it does not clash with `pnpm dev`.

## Scripts

| Command          | Does                                            |
| ---------------- | ----------------------------------------------- |
| `pnpm dev`       | MongoDB, then API and web in watch mode         |
| `pnpm build`     | Production builds of both apps                  |
| `pnpm lint`      | ESLint (typescript-eslint, strict type-checked) |
| `pnpm typecheck` | `tsc` for both apps, tests included             |
| `pnpm test`      | Vitest suites for both apps                     |
| `pnpm e2e`       | Playwright end-to-end suite (Chromium)          |
| `pnpm format`    | Prettier                                        |

CI (GitHub Actions) runs lint, typecheck, build, both Vitest suites and the e2e suite on every push.

## API

| Method | Path           | Notes                                                                          |
| ------ | -------------- | ------------------------------------------------------------------------------ |
| POST   | `/auth/signup` | 201 `{ user }` and the session cookie; 409 if the email is taken               |
| POST   | `/auth/signin` | 200 `{ user }` and the session cookie; one generic 401 for any bad credentials |
| GET    | `/auth/me`     | The signed-in user; 401 without a valid session                                |
| POST   | `/auth/logout` | 204, clears the cookie                                                         |

Signup and signin are rate limited (10 per minute per client IP). Every error has one JSON shape with a `requestId`.
The full contract, validation rules and messages are in [`docs/architecture.md` §4](docs/architecture.md#4-data-model).

## Project layout

```
apps/api     NestJS API (config, common: setup, errors, logging, throttling; users; auth)
apps/web     Next.js app (app router pages, components, lib: validation, session, API client)
fixtures/    Validation cases shared by both test suites
docs/        Architecture, decisions (ADRs), roadmap, design reference, future improvements
```

## Documentation

- [Architecture](docs/architecture.md): stack, module boundaries, data model and contract, rendering, environments,
  errors, testing, security
- [Decisions](docs/decisions/): one ADR per significant choice
- [Execution roadmap](docs/execution-roadmap.md): every task with its spec and status
- [AI usage](AI.md): how AI was used, task by task
- [Future improvements](docs/future-improvements.md): known limitations and next steps
