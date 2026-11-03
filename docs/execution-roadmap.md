<!-- docs/execution-roadmap.md -->
# Execution Roadmap

> The task tracker. Tick tasks in the same commit as the work.

## Status Legend
⬜ Not started 🔄 In progress ✅ Complete 🚫 Blocked

## Critical Path
M0 foundation → M1 backend auth → M2 frontend auth → M3 quality and bonus → M4 submission

Root scripts (created in 0.2, filled in by later tasks): `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest, both apps), `pnpm e2e` (Playwright). Per app: `pnpm --filter api test`, `pnpm --filter web test`.

Estimates are wall-clock minutes for one governed loop. Tasks marked "no reviewer (L)" skip the `governance-reviewer` (time-box decision at Gate 3); all others run it.

## M0 - Foundation

**Definition of done:** `pnpm install` then `pnpm dev` starts Mongo, web on :3000 and api on :4000; `pnpm lint`, `pnpm typecheck`, `pnpm test` pass; CI is green on GitHub; an invalid or missing required env var stops each app at boot with the variable names listed.

| # | Task | Status | Depends on | Runs via | Gate | Notes |
|---|---|---|---|---|---|---|
| 0.1 | AI workflow | ✅ | none | main session | — | docs templates, CLAUDE.md, subagents, MCP config |
| 0.2 | Workspace scaffold and tooling | ⬜ | 0.1 | researcher → main session | — | Next 16, Nest, Tailwind v4 setup verified via context7 |
| 0.3 | Local Mongo and API config | ⬜ | 0.2 | main session | env | Full §7 API env schema in one task |
| 0.4 | Web config: env, rewrite, headers | ⬜ | 0.2 | researcher → main session | env | Verify rewrite passes Set-Cookie and client IP. No reviewer (L) |
| 0.5 | Test harness | ⬜ | 0.3 | researcher → main session | — | SWC transform for decorator metadata |
| 0.6 | CI skeleton | ⬜ | 0.5 | main session | env, push | First push (repo private). No reviewer (L) |

### Task specs

**0.2 Workspace scaffold and tooling**
- Goal: a pnpm workspace with a booting NestJS skeleton and a rendering Next.js 16 + Tailwind v4 skeleton under shared lint, format and typecheck.
- Scope in: root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.config.*`, `.prettierrc`, `.gitignore`, `.nvmrc`; `apps/api/` (`package.json`, `tsconfig.json`, `src/main.ts`, `src/app.module.ts`); `apps/web/` (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.*`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`).
- Scope out: env, database, auth, tests, design beyond Tailwind defaults.
- Expected output: `pnpm install` clean; api listens on 4000; web serves a placeholder on 3000; all root scripts exist.
- Validation: `pnpm lint`, `pnpm typecheck`, `pnpm build` pass; Playwright MCP loads `http://localhost:3000` with no console errors.
- AI.md entry: which scaffold files the AI generated, which CLI demo files were removed, which strict TS flags were added by hand.
- Rollback: revert the commit.
- Complexity M · 35 min

**0.3 Local Mongo and API config**
- Goal: the API validates every §7 API variable at boot and connects to Mongo 8 from docker-compose.
- Scope in: `docker-compose.yml`, root `dev` script, `apps/api/src/config/`, `apps/api/src/app.module.ts`, `apps/api/.env.example`.
- Scope out: users schema, test database, tests (env unit tests land in 0.5).
- Expected output: `pnpm dev` starts Mongo, api and web; a 10-character `JWT_SECRET`, or `COOKIE_SECURE=false` with `NODE_ENV=production`, makes the api exit non-zero listing variable names only; with Mongo stopped the api exits within 5 s.
- Validation: the three boot checks run by hand; `pnpm typecheck`.
- AI.md entry: how the env rules were specified and whether the AI added defaults the spec forbids (for example a fallback `JWT_SECRET`).
- Rollback: revert; `docker compose down -v` removes local data.
- Complexity M · 25 min

**0.4 Web config: env, rewrite, headers**
- Goal: the web app validates `API_URL` at build and start, rewrites `/api/*` to the API, and sends the §10 web headers.
- Scope in: `apps/web/next.config.ts`, `apps/web/src/lib/env.ts`, `apps/web/.env.example`.
- Scope out: pages, API client, session helper.
- Expected output: `next build` fails without `API_URL`; a request to `/api/anything` on :3000 reaches Nest (its 404); web responses carry the three §10 headers.
- Validation: build failure observed; header check on `/`; researcher finding on Set-Cookie and forwarded-for pass-through recorded.
- AI.md entry: researcher findings on Next.js 16 rewrites and what the AI assumed from older versions.
- Rollback: revert.
- Complexity L · 15 min

**0.5 Test harness**
- Goal: Vitest runs in both apps, API tests emit decorator metadata, and the test database guard is enforced.
- Scope in: `apps/api/vitest.config.*`, `apps/api/test/setup/` (guard, app factory stub, cleanup helper), `apps/api/test/config.spec.ts`, `apps/api/test/di-smoke.spec.ts`, `apps/web/vitest.config.*`, root `test` script.
- Scope out: endpoint tests, web tests (first in 2.1).
- Expected output: `pnpm test` green; the DI smoke test resolves a provider through constructor injection; `TEST_MONGODB_URI` pointing at `auth_dev` aborts the suite before any test runs.
- Validation: env schema tests cover missing required vars, `JWT_SECRET` under 32 characters, `COOKIE_SECURE=false` in production; guard abort observed.
- AI.md entry: whether the AI's first Vitest config emitted decorator metadata, and how the failure showed.
- Rollback: revert.
- Complexity M · 25 min

**0.6 CI skeleton**
- Goal: GitHub Actions runs install, lint, typecheck and Vitest with a Mongo 8 service container on every push.
- Scope in: `.github/workflows/ci.yml`.
- Scope out: Playwright job (3.2).
- Expected output: a green run for the pushed branch; pnpm store cached; Node version from `.nvmrc`; test `JWT_SECRET` is a non-secret value in the workflow.
- Validation: green run link recorded in the AI.md entry.
- AI.md entry: CI config corrections (service container health check, cache key).
- Rollback: revert the workflow file.
- Complexity L · 15 min

## M1 - Backend auth

**Definition of done:** against the dev Mongo, signup, signin, `/auth/me` and logout behave per architecture §4 through curl; `pnpm --filter api test` is green; the §4 API contract is frozen (later changes go through `AMEND:`).

| # | Task | Status | Depends on | Runs via | Gate | Notes |
|---|---|---|---|---|---|---|
| 1.1 | API app setup, logging and errors | ⬜ | 0.5 | researcher → main session | — | nestjs-pino, filter, shared setup function |
| 1.2 | Users module | ⬜ | 1.1 | main session | — | Unique index awaited at boot |
| 1.3 | Validation fixtures and API DTOs | ⬜ | 0.5 | main session | — | Parallel with 1.1 |
| 1.4 | `POST /auth/signup` | ⬜ | 1.2, 1.3 | main session | — | Includes concurrent duplicate test |
| 1.5 | `POST /auth/signin` | ⬜ | 1.4 | main session | — | Generic 401, dummy verify |
| 1.6 | JWT guard and `GET /auth/me` | ⬜ | 1.5 | researcher → main session | — | passport-jwt cookie extraction |
| 1.7 | `POST /auth/logout` | ⬜ | 1.6 | main session | — | Idempotent 204. No reviewer (L) |
| 1.8 | Rate limiting on signup and signin | ⬜ | 1.7 | researcher → main session | — | Throttler current API, trusted proxy |

### Task specs

**1.1 API app setup, logging and errors**
- Goal: one shared setup function applies Helmet, CORS, cookie parser, JSON-only 10 KB body, ValidationPipe with the field-error factory, the global exception filter and Pino with request ids and redaction; `main.ts` and tests both use it.
- Scope in: `apps/api/src/common/`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/test/setup/` (app factory), `apps/api/test/common/`.
- Scope out: auth routes, Swagger.
- Expected output: an unknown route returns the §4 error shape with `NOT_FOUND` and a `requestId` equal to the `x-request-id` header.
- Validation: 404 shape test; an unexpected error from a test-only module returns 500 `INTERNAL_ERROR` with a generic message; captured log output contains the request id and none of the cookie or authorization values sent; CORS preflight allowed for `WEB_ORIGIN`, refused for another origin.
- AI.md entry: redaction paths the AI proposed vs the §10 list; whether it logged request bodies by default.
- Rollback: revert.
- Complexity H · 30 min

**1.2 Users module**
- Goal: the `User` schema with a unique email index awaited at boot, and a `UsersService` exposing create, find by email with hash, and find by id.
- Scope in: `apps/api/src/users/`, `apps/api/test/users/`.
- Scope out: hashing, HTTP, the 409 mapping (1.4).
- Expected output: after boot `users` has a unique `email` index; a duplicate create raises the module's typed duplicate error; default queries omit `passwordHash`.
- Validation: tests list indexes, assert hash absent on find by id, assert email stored trimmed and lowercased, assert the typed duplicate error.
- AI.md entry: whether the AI relied on a pre-check instead of the index, and the init-await fix if needed.
- Rollback: revert; drop `users` in `auth_dev` if its index differs.
- Complexity M · 15 min

**1.3 Validation fixtures and API DTOs**
- Goal: `fixtures/validation-cases.json` covers every §4 rule and the signup and signin DTOs return the exact §4 message for every row.
- Scope in: `fixtures/validation-cases.json`, `apps/api/src/auth/dto/`, `apps/api/src/auth/validators/`, `apps/api/test/auth/dto.spec.ts`.
- Scope out: controller, service, web schemas.
- Expected output: each rule has at least one valid and one invalid boundary row: password 7/8 and 128/129 characters; name 2/3 and 50/51 after trimming; email 254/255; `é` counts as special; a space never counts as special; an uppercase padded email normalizes; an unknown field is rejected.
- Validation: `pnpm --filter api test` runs every fixture row through class-validator.
- AI.md entry: where the AI's email or special-character logic disagreed with §4, and which boundary rows were added by hand.
- Rollback: revert.
- Complexity M · 20 min

**1.4 `POST /auth/signup`**
- Goal: create a user with an argon2id hash, set the `access_token` cookie, return `{ user }`.
- Scope in: `apps/api/src/auth/` (module, controller, service, cookie helper), `apps/api/test/auth/signup.spec.ts`.
- Scope out: signin, guard, throttling.
- Expected output: 201 with cookie and `{ user }` holding only id, email, name, createdAt; duplicate email gives 409 `EMAIL_TAKEN` with `fieldErrors.email`.
- Validation: every signup fixture row over HTTP; 5 parallel signups with one email give one 201, four 409 and one document; response bodies never contain `passwordHash` or the password; captured logs never contain the password or hash; URL-encoded body and unknown fields give 400; cookie flags asserted with `COOKIE_SECURE` false and true.
- AI.md entry: whether the AI mapped 11000 itself or added a pre-check; cookie attribute corrections.
- Rollback: revert.
- Complexity H · 30 min

**1.5 `POST /auth/signin`**
- Goal: verify credentials with one generic 401 and a dummy argon2 verify for unknown emails, then set the cookie.
- Scope in: `apps/api/src/auth/` (controller, service), `apps/api/test/auth/signin.spec.ts`.
- Scope out: guard, throttling.
- Expected output: 200 with cookie and `{ user }`; unknown email and wrong password return identical bodies apart from `requestId`.
- Validation: signin fixture rows; mixed-case email signs in; a spy confirms a verify call on unknown email.
- AI.md entry: whether the AI returned distinct errors for unknown email and wrong password.
- Rollback: revert.
- Complexity M · 20 min

**1.6 JWT guard and `GET /auth/me`**
- Goal: a Passport JWT strategy reading the cookie, HS256 pinned, 30 s tolerance, and a guarded `/auth/me`.
- Scope in: `apps/api/src/auth/` (strategy, guard, controller), `apps/api/test/auth/me.spec.ts`.
- Scope out: web.
- Expected output: 200 `{ user }` with a valid cookie; 401 `UNAUTHENTICATED` otherwise.
- Validation: tests for missing cookie, malformed token, wrong signature, `alg: none`, expired beyond tolerance (minted directly), and a valid token whose user was deleted.
- AI.md entry: researcher findings on cookie extraction; any algorithm-pinning correction.
- Rollback: revert.
- Complexity M · 25 min

**1.7 `POST /auth/logout`**
- Goal: an anonymous, idempotent logout that clears the cookie.
- Scope in: `apps/api/src/auth/` (controller, cookie helper), `apps/api/test/auth/logout.spec.ts`.
- Scope out: token revocation.
- Expected output: 204 with a clearing `Set-Cookie` (same Path, SameSite, HttpOnly, Secure; Max-Age 0), with or without an incoming cookie.
- Validation: tests for both cases and attribute equality with the issuing cookie.
- AI.md entry: whether the AI guarded the route (spec says anonymous) and why that was changed.
- Rollback: revert.
- Complexity L · 10 min

**1.8 Rate limiting on signup and signin**
- Goal: 10 requests per 60 s per client IP on signup and signin, client IP read through one trusted proxy hop.
- Scope in: `apps/api/src/app.module.ts` (throttler registration), `apps/api/src/auth/` (route decorators), `apps/api/src/common/` (IP tracker), `apps/api/test/auth/throttle.spec.ts`.
- Scope out: `/auth/me`, logout, shared store.
- Expected output: past the limit, 429 `RATE_LIMITED` with `Retry-After`; another forwarded IP is unaffected; `/auth/me` never returns 429.
- Validation: tests with `THROTTLE_AUTH_LIMIT=3`; two distinct `X-Forwarded-For` values; `/auth/me` called past the limit.
- AI.md entry: researcher findings on the throttler's current options; the proxy-IP keying risk and how the test proves it fixed.
- Rollback: revert.
- Complexity M · 20 min

## M2 - Frontend auth

**Definition of done:** in a real browser a user can sign up, land on `/app` showing "Welcome to the application.", log out, and sign in again; `pnpm --filter web test` is green; no console errors on any route.

| # | Task | Status | Depends on | Runs via | Gate | Notes |
|---|---|---|---|---|---|---|
| 2.1 | Web Zod schemas with parity tests | ⬜ | 1.3 | main session | — | Parallel with 1.2 onward. No reviewer (L) |
| 2.2 | API client, session helper and app shell | ⬜ | 0.4, 0.5 | researcher → main session | — | Async cookies, no-store fetch, redirects |
| 2.3 | `/app` page and logout button | ⬜ | 2.2, 1.7 | main session | — | Playwright MCP check. No reviewer (L) |
| 2.4 | `/signup` page | ⬜ | 2.1, 2.3, 1.4 | main session | — | Introduces form field and alert components |
| 2.5 | `/signin` page | ⬜ | 2.4, 1.5 | main session | — | Reuses 2.4 components. No reviewer (L) |

### Task specs

**2.1 Web Zod schemas with parity tests**
- Goal: Zod signup and signin schemas that return the exact §4 message for every fixture row.
- Scope in: `apps/web/src/lib/validation.ts`, `apps/web/test/validation.spec.ts`.
- Scope out: forms, API client.
- Expected output: schemas exported for React Hook Form.
- Validation: `pnpm --filter web test` runs every `fixtures/validation-cases.json` row and asserts the message.
- AI.md entry: rows that failed on the first AI draft and why.
- Rollback: revert.
- Complexity L · 15 min

**2.2 API client, session helper and app shell**
- Goal: a browser API client with error mapping, a server session helper, and the shell routes.
- Scope in: `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/session.ts`, `apps/web/src/lib/errors.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/error.tsx`, `apps/web/src/app/not-found.tsx`, `apps/web/test/errors.spec.ts`.
- Scope out: form pages, `/app`.
- Expected output: `/` redirects anonymous users to `/signin`; with the API stopped `/` renders the error page; the session helper forwards only the `access_token` cookie and the forwarded-for header and never caches.
- Validation: unit tests map 400, 401, 409, 429 (with `Retry-After`), 5xx and network failure to the §8 displays; Playwright MCP: `/` redirect observed, API-down error page shows retry with no unhandled console errors.
- AI.md entry: researcher findings on Next.js 16 async `cookies()` and redirects; any client-side session check the AI proposed and why it was rejected.
- Rollback: revert.
- Complexity M · 30 min

**2.3 `/app` page and logout button**
- Goal: the protected page and a client leaf logout button.
- Scope in: `apps/web/src/app/app/page.tsx`, `apps/web/src/components/logout-button.tsx`.
- Scope out: forms.
- Expected output: authenticated users see exactly "Welcome to the application." and a logout button; anonymous users are redirected to `/signin`; logout returns to `/signin` and `/app` then redirects.
- Validation: Playwright MCP creates a session with an in-page fetch to `/api/auth/signup`, loads `/app`, logs out, reloads `/app`; button disabled while pending; keyboard reachable; no console errors.
- AI.md entry: whether the AI put `'use client'` on the page, and how it was moved to the leaf.
- Rollback: revert.
- Complexity L · 15 min

**2.4 `/signup` page**
- Goal: the signup form per §8 with server errors mapped onto fields.
- Scope in: `apps/web/src/app/signup/page.tsx`, `apps/web/src/components/signup-form.tsx`, `apps/web/src/components/form-field.tsx`, `apps/web/src/components/form-alert.tsx`.
- Scope out: signin page.
- Expected output: valid signup lands on `/app`; invalid input shows §4 messages on blur; a duplicate email shows the 409 field error; signed-in users visiting `/signup` go to `/app`.
- Validation: Playwright MCP: labels present; tab order email → name → password → submit; focus moves to the first invalid field on submit; errors announced; submit disabled while pending; no horizontal scroll at 320 px; no console errors.
- AI.md entry: accessibility gaps in the AI's first form draft and the fixes.
- Rollback: revert.
- Complexity M · 25 min

**2.5 `/signin` page**
- Goal: the signin form reusing the 2.4 components.
- Scope in: `apps/web/src/app/signin/page.tsx`, `apps/web/src/components/signin-form.tsx`.
- Scope out: changes to shared components beyond props.
- Expected output: valid signin lands on `/app`; wrong credentials show "Invalid email or password"; 429 shows the wait message; signed-in users visiting `/signin` go to `/app`.
- Validation: Playwright MCP: same checks as 2.4, plus identical error text for unknown email and wrong password.
- AI.md entry: reuse vs duplication decisions on the shared components.
- Rollback: revert.
- Complexity L · 15 min

## M3 - Quality and bonus

**Definition of done:** Playwright e2e is green in CI; `/docs` is live in development and absent when `NODE_ENV=production`; log redaction tests (1.1, 1.4) are green in CI.

| # | Task | Status | Depends on | Runs via | Gate | Notes |
|---|---|---|---|---|---|---|
| 3.1 | Swagger at `/docs` | ⬜ | 1.8 | researcher → main session | — | CSP relaxed on `/docs` only |
| 3.2 | E2E suite and CI job | ⬜ | 2.5, 1.8, 0.6 | researcher → main session | push | Production builds, test DB |

### Task specs

**3.1 Swagger at `/docs`**
- Goal: OpenAPI docs for the four endpoints with the cookie auth scheme, mounted only outside production.
- Scope in: `apps/api/src/common/` (setup function), `apps/api/src/auth/` (controller and DTO doc decorators), `apps/api/test/docs.spec.ts`.
- Scope out: contract behavior changes.
- Expected output: `/docs` renders all four endpoints with request and error schemas.
- Validation: 200 on `/docs` in development and 404 with `NODE_ENV=production`; Playwright MCP loads `/docs` with no CSP console errors; JSON endpoints still return the default Helmet CSP.
- AI.md entry: how the AI handled the Helmet and Swagger UI CSP clash.
- Rollback: revert.
- Complexity M · 15 min

**3.2 E2E suite and CI job**
- Goal: Playwright covers the §9 e2e flows against production builds and runs in CI.
- Scope in: `apps/web/playwright.config.ts`, `apps/web/e2e/`, `.github/workflows/ci.yml` (e2e job), root `e2e` script.
- Scope out: visual regression, browsers beyond Chromium.
- Expected output: §9 e2e flows green; `users` cleared before the run; the API starts with the test URI.
- Validation: `pnpm e2e` green locally; CI e2e job green; the guard aborts the run if pointed at `auth_dev`.
- AI.md entry: researcher findings on Playwright web server setup for two apps; flakiness fixes.
- Rollback: revert.
- Complexity H · 40 min

## M4 - Submission

**Definition of done:** the repo is public; a fresh clone works by following the README alone; AI.md has all four sections backed by per-task entries; no secret is in git history.

| # | Task | Status | Depends on | Runs via | Gate | Notes |
|---|---|---|---|---|---|---|
| 4.1 | README | ⬜ | 3.1, 3.2 | main session | — | No reviewer (L) |
| 4.2 | AI.md summary and future improvements | ⬜ | 4.1 | main session | — | Summary built from existing entries. No reviewer (L) |
| 4.3 | Clean-clone check and release | ⬜ | 4.2 | main session | push, public | Owner shares the link. No reviewer (L) |

### Task specs

**4.1 README**
- Goal: a README that takes a reviewer from clone to running app and tests.
- Scope in: `README.md`.
- Scope out: architecture detail (linked, not copied).
- Expected output: prerequisites, setup, env files, scripts, test commands, `/docs` link, links to `docs/architecture.md`, ADRs, `AI.md`, `docs/future-improvements.md`.
- Validation: every command runs as written (proven in 4.3).
- AI.md entry: what the AI's README draft overstated or got wrong.
- Rollback: revert.
- Complexity L · 15 min

**4.2 AI.md summary and future improvements**
- Goal: a short summary for each of the four required AI.md sections, citing task entries; future improvements finalized.
- Scope in: `AI.md` (summary block only; task entries are not rewritten), `docs/future-improvements.md`.
- Scope out: new features.
- Expected output: each section cites at least two task entries; every roadmap task has an entry; actual vs estimated time stated.
- Validation: roadmap rows cross-checked against entry headings.
- AI.md entry: how the summary was assembled and what the AI's draft summary overclaimed.
- Rollback: revert.
- Complexity L · 15 min

**4.3 Clean-clone check and release**
- Goal: prove the repo works from scratch, then push and make it public.
- Scope in: no file changes expected; fixes go back to the owning task's files.
- Scope out: hosting.
- Expected output: in a fresh clone: `pnpm install`, README steps, `pnpm test`, `pnpm e2e` green; no `.env` file or real secret in `git log`; repo public.
- Validation: the commands above; history search for `.env` paths and the dev `JWT_SECRET` value.
- AI.md entry: anything the clean clone exposed.
- Rollback: make the repo private again.
- Complexity L · 10 min

## Dependency graph

```
0.1 ─ 0.2 ─┬─ 0.3 ─ 0.5 ─┬─ 1.1 ─ 1.2 ─┐
           │             │             ├─ 1.4 ─ 1.5 ─ 1.6 ─ 1.7 ─ 1.8 ─┬─ 3.1 ─┐
           │             ├─ 1.3 ───────┘     │     │           │      │       │
           │             │    └─ 2.1 ──┐     │     │           │      │       │
           │             └─ 0.6 ───────┼─────┼─────┼───────────┼──────┼───┐   │
           └─ 0.4 ─────────── 2.2 ─────┼─────┼─────┼─── 2.3 ───┘      │   │   │
                                       │     │     │     │            │   │   │
                                       └─────┴── 2.4 ────┘            │   │   │
                                                   │                  │   │   │
                                                   └── 2.5 ───────────┴─ 3.2 ─┴─ 4.1 ─ 4.2 ─ 4.3
```
2.3 needs 2.2 and 1.7; 2.4 needs 2.1, 2.3, 1.4; 2.5 needs 2.4 and 1.5; 3.2 needs 2.5, 1.8, 0.6.

**Critical path:** 0.2 → 0.3 → 0.5 → 1.1 → 1.2 → 1.4 → 1.5 → 1.6 → 1.7 → 2.3 → 2.4 → 2.5 → 3.2 → 4.1 → 4.2 → 4.3.

## Parallelizable sets
Run in separate git worktrees; merge in task-number order.

| Set | Tasks | Why safe |
|---|---|---|
| P1 | 0.3 ∥ 0.4 | api config and root compose vs web config only |
| P2 | 1.1 ∥ 1.3 | `common/`, `main.ts`, `app.module.ts` vs `auth/dto`, `auth/validators`, `fixtures/` |
| P3 | 2.1 ∥ 2.2 ∥ (1.2 → 1.4) | web `lib/` files vs api; the §4 contract is written, so web codes against the spec |
| P4 | 1.8 ∥ 2.4 | api auth decorators vs web signup files |
| P5 | 3.1 ∥ 3.2 | api docs vs web e2e and CI |

## Time budget
25 tasks. Effort 480 min with the reviewer on every task; about 440 min with the reviewer skipped on L tasks (decision taken). Critical path about 320 min using the parallel sets. This is over a 4-hour reading of "a few hours"; AI.md states actual vs estimated time.

Cut order if behind at the end of M2: (1) Swagger CSP scoping in 3.1 (plain Swagger, dev only); (2) the 320 px check; (3) the `alg: none` case. Never cut: parity fixtures, concurrent signup test, generic signin, e2e, AI.md entries.

## Requirement traceability

| Requirement (brief) | Task IDs |
|---|---|
| Frontend React or Vue with TypeScript | 0.2 |
| Signup form: email, name, password | 2.4 |
| Email valid format (web and api) | 1.3, 2.1, 2.4 |
| Name at least 3 characters | 1.3, 2.1, 2.4 |
| Password at least 8, letter, number, special | 1.3, 2.1, 2.4 |
| Signin form: email and password | 2.5 |
| Application page shows "Welcome to the application." | 2.3 |
| Logout button ends the session | 1.7, 2.3 |
| Backend NestJS with MongoDB | 0.2, 0.3, 1.2 |
| Signup endpoint enforces the same rules | 1.3, 1.4 |
| Signin endpoint enforces the same rules | 1.3, 1.5 |
| At least one protected endpoint | 1.6 |
| Protected route rejects unauthenticated requests | 1.6, 2.3, 3.2 |
| Validation matches on front end and back end | 1.3, 2.1, 3.2 |
| All pages and endpoints work end to end | 3.2, 4.3 |
| README | 4.1, 4.3 |
| AI.md with the four required sections | every task (entry), 4.2 |
| Public repository, link shared | 4.3 |
| Out of scope respected | 4.2 (future improvements), reviewer on non-L tasks |
| Scoring: functionality | M1, M2, 3.2 |
| Scoring: production-readiness | 0.3, 0.4, 1.1, 1.4, 1.5, 1.6, 1.8 |
| Scoring: code quality | 0.2 (lint, strict TS), reviewer on non-L tasks |
| Scoring: delivery speed | Time budget, parallel sets |
| Bonus: logging | 1.1 |
| Bonus: error handling | 1.1, 2.2 |
| Bonus: testing | 0.5, 1.1 to 1.8, 2.1, 2.2, 3.2 |
| Bonus: basic CI/CD | 0.6, 3.2 |
| Bonus: API documentation | 3.1 |