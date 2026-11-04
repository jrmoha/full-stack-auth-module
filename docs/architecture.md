<!-- docs/architecture.md -->
# Architecture

> Agents read this before any non-trivial change, so keep it accurate; update it in the
> same commit as the code that changes it.

## 1. Overview
A full-stack authentication module built as a time-boxed engineering assessment. Users sign up with email, name and password, sign in, reach a protected page that shows "Welcome to the application.", and log out. The web app (Next.js) is the only origin the browser talks to; it proxies API calls to a NestJS service backed by MongoDB, and the session lives in an httpOnly cookie. The evaluator is a recruiter and a reviewing engineer who clone the public repo, run it from the README, and read AI.md for evidence of engineering judgement.

## 2. Stack
- pnpm workspace monorepo: `apps/web` and `apps/api`. Locked by the owner.
- Next.js 16 (App Router), React, TypeScript strict: frontend in `apps/web/src/app/`. The assessment mandates React or Vue with TypeScript; Next.js locked by the owner.
- React Hook Form + Zod: web forms and validation, mirroring §4. Locked by the owner. Parity: [ADR](decisions/2026-11-03-validation-parity.md).
- Tailwind CSS v4 (`@tailwindcss/postcss`): web styling only. Locked by the owner.
- NestJS, TypeScript: backend in `apps/api/src/`. Mandated by the assessment.
- MongoDB 8 via Mongoose (`@nestjs/mongoose`): MongoDB mandated by the assessment, Mongoose locked by the owner. Uniqueness: [ADR](decisions/2026-11-03-email-uniqueness.md).
- `@nestjs/jwt` + Passport JWT strategy, token in an httpOnly cookie: locked by the owner. [Session ADR](decisions/2026-11-03-session-strategy.md), [Topology ADR](decisions/2026-11-03-request-topology.md), [Logout ADR](decisions/2026-11-03-logout.md).
- `argon2` (argon2id): password hashing. [ADR](decisions/2026-11-03-password-hashing.md).
- `class-validator` + `class-transformer`, global `ValidationPipe` (whitelist, reject unknown fields, transform): locked by the owner. [ADR](decisions/2026-11-03-validation-parity.md).
- Helmet, CORS limited to the web origin: locked by the owner. Stance in §10.
- `@nestjs/throttler`, in-memory store: locked by the owner. [ADR](decisions/2026-11-03-rate-limiting.md).
- `nestjs-pino`: structured request logging with redaction. Assessment bonus item.
- Global exception filter: one error shape. Assessment bonus item. Shape in §4.
- `@nestjs/swagger` at `/docs`: assessment bonus item. [ADR](decisions/2026-11-03-swagger-exposure.md).
- Vitest (+ SWC transform for decorator metadata) and supertest: API integration and web unit tests. Locked by the owner. [ADR](decisions/2026-11-03-test-db-isolation.md).
- Playwright: e2e. Locked by the owner.
- GitHub Actions: lint, typecheck, Vitest, Playwright on push. Locked by the owner.
- ESLint (typescript-eslint flat config) + Prettier: required by the locked CI lint step.

Supporting libraries that implement locked items (not new decisions): `@nestjs/config` (env validation at boot with a class-validator schema), `cookie-parser` (the JWT strategy reads the cookie), `pino-pretty` (development only).

## 3. Module boundaries

| Path | Responsibility | May import from |
|---|---|---|
| `apps/api/src/main.ts`, `apps/api/src/app.module.ts` | Composition root: bootstrap, module wiring | everything in `apps/api/src/` |
| `apps/api/src/config/` | Env schema and validation at boot | none |
| `apps/api/src/common/` | Exception filter, decorators, logging setup, IP tracker, the shared app setup function (Helmet, CORS, cookie parser, JSON-only body, ValidationPipe, filter, Swagger mount) used by `main.ts` and tests, pure helpers | `config/` |
| `apps/api/src/users/` | `User` Mongoose schema and data access | `common/`, `config/` |
| `apps/api/src/auth/` | Controller (HTTP only: validate DTO → call service → respond), service, JWT strategy, guard, DTOs, custom validators, cookie helper | `users/` (exported service only), `common/`, `config/` |
| `apps/web/next.config.ts` | Rewrites, security headers, env validation trigger | `src/lib/` |
| `apps/web/src/app/` | Routes, pages, layouts (Server Components), `error.tsx`, `not-found.tsx` | `components/`, `lib/` |
| `apps/web/src/components/` | UI. `'use client'` only on small leaf components | `lib/` |
| `apps/web/src/lib/` | Zod schemas, env schema, API client, session helper, error mapping, pure helpers | none |
| `apps/api/test/`, `apps/web/test/`, `apps/web/e2e/` | Tests | anything in their own app, plus `fixtures/` |
| `fixtures/` (repo root) | Validation case data (JSON) read by both test suites. Data only, never imported by runtime code | none |
| `docker-compose.yml`, `.github/workflows/` (repo root) | Local Mongo 8, CI | n/a |

`apps/web` and `apps/api` never import from each other. Validation rules are mirrored, not shared.

## 4. Data model

| Collection | Purpose | Key fields | Indexes | Access (read / write) |
|---|---|---|---|---|
| `users` | Registered accounts | `_id` ObjectId; `email` string, required, trimmed, lowercased, max 254; `name` string, required, trimmed, 3 to 50; `passwordHash` string, required, excluded from queries by default; `createdAt`, `updatedAt` timestamps; no version key | `_id` (default); `email` unique | Read: `UsersService` only (by email with hash for signin, by id for `/auth/me`). Write: `UsersService.create` only. No updates or deletes in scope |

No other collections. No relationships.

### Validation rules (source of truth)
Normalization runs before checks: email is trimmed and lowercased; name is trimmed; password is never trimmed. Web and API messages are identical text. Check order is the table order; the web shows the first failing message, the API returns every failing message for the field. A field is present only if it is a string that is not empty after normalization (so a blank or whitespace-only email or name, or an empty password, reads as required); a field that is not present reports only its required message. Lengths count UTF-16 code units (JavaScript `length`) on both sides. Whitespace means JavaScript's `\s` set, which is also what trimming removes (space, tab, newline, NBSP and the other Unicode spaces). Every rule has rows in `fixtures/validation-cases.json`, and both test suites run every row.

| Field | Rule in plain words | Web (Zod) message | API (class-validator) message |
|---|---|---|---|
| email (signup, signin) | Present and a string | Email is required | Email is required |
| email | At most 254 characters | Email must be at most 254 characters | Email must be at most 254 characters |
| email | Format: exactly one `@`; non-empty local part with no whitespace; domain of two or more dot-separated labels, each label letters, digits or hyphens, not starting or ending with a hyphen; last label at least 2 letters. Same custom rule on both sides, not either library's default | Enter a valid email address | Enter a valid email address |
| name (signup) | Present and a string | Name is required | Name is required |
| name | At least 3 characters after trimming | Name must be at least 3 characters | Name must be at least 3 characters |
| name | At most 50 characters after trimming | Name must be at most 50 characters | Name must be at most 50 characters |
| password (signup) | Present and a string | Password is required | Password is required |
| password | At least 8 characters | Password must be at least 8 characters | Password must be at least 8 characters |
| password | At most 128 characters | Password must be at most 128 characters | Password must be at most 128 characters |
| password | Contains a letter (A-Z or a-z) | Password must contain a letter | Password must contain a letter |
| password | Contains a digit (0-9) | Password must contain a number | Password must contain a number |
| password | Contains a special character: any character that is not an ASCII letter, a digit or whitespace. Whitespace is allowed but never counts. Non-ASCII letters such as `é` count as special | Password must contain a special character | Password must contain a special character |
| password (signin) | Present and a string | Password is required | Password is required |
| password (signin) | At most 128 characters. No complexity check: signin never reveals the policy | Password must be at most 128 characters | Password must be at most 128 characters |
| any body field (API) | Unknown fields rejected | n/a (forms send known fields only) | Field is not allowed |

### API contract
Paths are on the API origin. The browser reaches them as `/api/<path>` on the web origin through the rewrite. Bodies are JSON only; the URL-encoded parser is disabled; body limit 10 KB.

| Method | Path | Auth | Request body | Success | Errors | Rate limit |
|---|---|---|---|---|---|---|
| POST | `/auth/signup` | anonymous | email, name, password | 201, `{ user }`, sets `access_token` cookie | 400 `VALIDATION_FAILED`; 409 `EMAIL_TAKEN` with field error on `email` "An account with this email already exists"; 429 `RATE_LIMITED`; 500 `INTERNAL_ERROR`; 503 `SERVICE_UNAVAILABLE` | 10 per 60 s per client IP |
| POST | `/auth/signin` | anonymous | email, password | 200, `{ user }`, sets `access_token` cookie | 400; 401 `INVALID_CREDENTIALS` "Invalid email or password", identical for unknown email and wrong password; 429; 500; 503 | 10 per 60 s per client IP |
| GET | `/auth/me` | cookie | none | 200, `{ user }` | 401 `UNAUTHENTICATED` (missing, malformed, expired, bad signature, or user no longer exists); 500; 503 | none |
| POST | `/auth/logout` | anonymous | none | 204, clears `access_token` (same attributes, Max-Age 0) | 500 | none |

`user` object: `id`, `email`, `name`, `createdAt`. Nothing else. No response ever includes the password or its hash.

**Error shape** (every non-2xx response, produced by the global exception filter):

| Field | Type | Notes |
|---|---|---|
| `statusCode` | number | Mirrors the HTTP status |
| `code` | string | One of `VALIDATION_FAILED`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `RATE_LIMITED`, `NOT_FOUND`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR` |
| `message` | string | Human-readable, safe to display, never a stack or driver message |
| `requestId` | string | UUID generated per request; also sent as the `x-request-id` header and logged |
| `fieldErrors` | object, optional | Keys are form field names (`email`, `name`, `password`); values are arrays of §4 messages |

429 also sends `Retry-After` in seconds.

## 5. Access model
No roles exist; the brief has none. A request is anonymous or authenticated (a valid, unexpired `access_token` cookie whose `sub` resolves to an existing user).

**API endpoints**

| Endpoint | Anonymous | Authenticated |
|---|---|---|
| `POST /auth/signup` | Allowed | Allowed (API is stateless; the web redirects signed-in users away first). New cookie replaces the old |
| `POST /auth/signin` | Allowed | Allowed, cookie replaced |
| `GET /auth/me` | 401 | 200 |
| `POST /auth/logout` | 204 (idempotent) | 204, cookie cleared |
| `GET /docs` | Allowed outside production; absent in production | Same |

**Web routes**

| Route | Anonymous | Authenticated |
|---|---|---|
| `/` | Redirect `/signin` | Redirect `/app` |
| `/signin` | Render form | Redirect `/app` |
| `/signup` | Render form | Redirect `/app` |
| `/app` | Redirect `/signin` | Render "Welcome to the application." and a logout button |
| unknown | `not-found.tsx` | `not-found.tsx` |

Redirects carry no `next` or return-URL parameter.

## 6. Rendering & caching
Every session check runs in the page Server Component through the `lib/` session helper, which calls `API_URL/auth/me` server-to-server, forwarding only the `access_token` cookie and the client's forwarded-for header, with caching disabled. It returns the user on 200, nothing on 401, and throws on network failure or 5xx (rendered by `error.tsx`). No request-interception file (middleware or proxy) is used. Cache Components and `use cache` are not enabled.

| Route | Static / dynamic | Auth check runs in | Data source | Cache policy |
|---|---|---|---|---|
| `/` | Dynamic (reads cookies) | Page Server Component | `GET /auth/me` | No store; redirect only |
| `/signin` | Dynamic | Page Server Component | `GET /auth/me` | No store |
| `/signup` | Dynamic | Page Server Component | `GET /auth/me` | No store |
| `/app` | Dynamic | Page Server Component | `GET /auth/me` | No store; never cached by any shared cache |
| `/api/*` | Rewrite to API | API JWT guard where applicable | API | Not cached |
| Static assets | Static | none | Build output | Next.js defaults (immutable hashed files) |

Revalidation: N/A, no editor-managed content.

Client leaf components: signup form, signin form, logout button, and the form field and alert components they render. Forms post to `/api/auth/signup` or `/api/auth/signin`, then navigate to `/app` replacing history. Logout posts to `/api/auth/logout`, then navigates to `/signin` replacing history.

**Signin and protected page sequence**

```
Browser               Next.js web (:3000)               Nest API (:4000)            Mongo
  |                          |                                 |                        |
  | POST /api/auth/signin    |                                 |                        |
  | {email, password}        |                                 |                        |
  |------------------------->| rewrite /api/* to API_URL       |                        |
  |                          | (passes X-Forwarded-For through;|                        |
  |                          |  adds none, see §10)            |                        |
  |                          |-------------------------------->| throttle by client IP  |
  |                          |                                 | ValidationPipe on DTO  |
  |                          |                                 | find user by email     |
  |                          |                                 | (with hash)            |
  |                          |                                 |----------------------->|
  |                          |                                 |<-----------------------|
  |                          |                                 | argon2 verify          |
  |                          |                                 | (dummy verify if none) |
  |                          |                                 | sign JWT {sub}         |
  |                          |<--------------------------------| 200 {user}             |
  |                          |   Set-Cookie: access_token=...; HttpOnly; SameSite=Lax;  |
  |                          |   Path=/; Max-Age=3600; Secure (production)              |
  |<-------------------------| 200 {user} + Set-Cookie passed through                   |
  |  cookie stored for the web origin (first-party)                                     |
  |                          |                                 |                        |
  | navigate to /app         |                                 |                        |
  | GET /app                 |                                 |                        |
  | Cookie: access_token     |                                 |                        |
  |------------------------->| page Server Component awaits    |                        |
  |                          | cookies()                       |                        |
  |                          | GET API_URL/auth/me             |                        |
  |                          | Cookie: access_token, no-store  |                        |
  |                          |-------------------------------->| JWT guard verifies     |
  |                          |                                 | (HS256, 30 s leeway)   |
  |                          |                                 | find user by id        |
  |                          |                                 |----------------------->|
  |                          |                                 |<-----------------------|
  |                          |<--------------------------------| 200 {user}             |
  |<-------------------------| HTML "Welcome to the application."                       |
```

## 7. Environments & deploy

| Environment | Database | URLs | Index creation |
|---|---|---|---|
| Local dev | docker-compose `mongo:8` on host port 27018, database `auth_dev` | web `http://localhost:3000`, API `http://localhost:4000`, Swagger `http://localhost:4000/docs` | Mongoose autoIndex; the users module awaits model init at boot, so the API does not serve until the unique index exists |
| Local test | Same container, database `auth_test` | API booted in-process (integration) or on :4000 (e2e) | Test setup awaits model init before the first test; cleanup deletes documents, never drops, so the index survives |
| CI | GitHub Actions service container `mongo:8`, database `auth_test` | Same as local test | Same as local test |
| Production (stance, not deployed) | Managed MongoDB over TLS | HTTPS only; web and API behind one proxy hop, an edge proxy that appends `X-Forwarded-For` (the Next.js rewrite adds none; §10) | autoIndex at boot is acceptable at this collection size; a large existing collection would get the index built out of band first. Boot fails loudly if the unique index cannot build (existing duplicates) |

Migrations: N/A. A schema or index change is a Mongoose change plus an update to §4 in the same commit. Hosting and Dockerfiles are out of scope (see `docs/future-improvements.md`).

Root `pnpm dev` starts the Mongo container, then both apps in parallel.

**Environment variables**

| Name | App | Required | Example | Purpose |
|---|---|---|---|---|
| `NODE_ENV` | api | yes | `development` | One of development, test, production. Drives Swagger, log format, cookie default |
| `PORT` | api | no (default 4000) | `4000` | HTTP port |
| `MONGODB_URI` | api | yes | `mongodb://localhost:27018/auth_dev` | Database connection |
| `JWT_SECRET` | api | yes, at least 32 characters, no default | `replace-with-64-random-hex-characters-0000000000000000000000000` | HS256 signing key. The example value is refused at boot; generate one with `openssl rand -hex 32` |
| `JWT_TTL_SECONDS` | api | no (default 3600) | `3600` | Token lifetime and cookie Max-Age |
| `WEB_ORIGIN` | api | yes | `http://localhost:3000` | Only allowed CORS origin |
| `COOKIE_SECURE` | api | no (default true in production, false otherwise) | `false` | Secure cookie flag. Boot refuses `false` when NODE_ENV is production |
| `TRUST_PROXY_HOPS` | api | no (default 1) | `1` | Proxy hops trusted when reading the client IP |
| `THROTTLE_AUTH_LIMIT` | api | no (default 10) | `10` | Requests per window on signup and signin |
| `THROTTLE_AUTH_TTL_SECONDS` | api | no (default 60) | `60` | Rate-limit window |
| `LOG_LEVEL` | api | no (default info) | `info` | Pino level |
| `TEST_MONGODB_URI` | api, web (e2e) | tests only | `mongodb://localhost:27018/auth_test` | Test database. Not read by the running app; the test guard requires the database name to end in `_test` and to differ from `MONGODB_URI` |
| `API_URL` | web | yes, server-only | `http://localhost:4000` | Rewrite target and server-side session fetch |

No `NEXT_PUBLIC_` variables exist. The browser only uses relative `/api` paths. App variables are validated at boot (api) and at build and start (web).

## 8. Error handling

**API**
- The global exception filter emits the §4 error shape for every error. Unknown errors become 500 `INTERNAL_ERROR` with a generic message; the stack is logged with the request id, never returned.
- `ValidationPipe` uses a custom exception factory that builds `fieldErrors` keyed by DTO property names, which match form field names.
- Duplicate email: the service relies on Mongo duplicate-key error 11000 on insert and returns 409 `EMAIL_TAKEN`. No pre-check query.
- Throttler rejection: 429 `RATE_LIMITED` with `Retry-After`.
- Mongo down at boot: connection fails within the 5 s server-selection timeout and the process exits non-zero. Mongo down at runtime: server-selection errors map to 503 `SERVICE_UNAVAILABLE`.
- Invalid env at boot: the process exits non-zero listing failing variable names, never values.
- Unreadable request: invalid JSON is 400, a body over 10 KB is 413, an unsupported charset is 415; each uses code `VALIDATION_FAILED` without `fieldErrors`. A non-JSON content type (e.g. URL-encoded) is not parsed, so the DTO rejects it with 400. Every error response, including these, carries `requestId` and the `x-request-id` header.

**Web**
- `app/error.tsx` catches render errors, including the session helper throwing when the API is down: shows "Something went wrong" and a retry button. Next.js requires it to be a client component; this is the one allowed exception to the leaf-only rule.
- `app/not-found.tsx`: Server Component with a link to `/`.
- Missing or invalid `API_URL`: `next build` and `next start` fail.

**Form failure UX**

| Status | Display |
|---|---|
| 400 | `fieldErrors` mapped onto fields; anything else in the form alert |
| 401 (signin) | Form alert: "Invalid email or password" |
| 409 (signup) | Field error on email: "An account with this email already exists" |
| 429 | Form alert: "Too many attempts. Try again in N seconds." (N from `Retry-After`) |
| 5xx or network failure | Form alert: "Something went wrong. Try again." plus "Reference: <requestId>" when present |

**Form behavior and accessibility (WCAG 2.1 AA, evergreen browsers)**
- Validate on blur, then on change. Password rules shown as a hint under the field.
- Every input has a visible label; error text is linked to its input and announced; the form alert is a live region; focus moves to the first invalid field on submit.
- Submit disabled with a pending label while a request is in flight; double submit is impossible. Logout button disabled while pending.
- No horizontal scroll at 320 px width.
- Expired session: detected on the next `/app` render, which redirects to `/signin`. No client polling. Logout with an expired cookie still returns 204.

## 9. Testing strategy

| Layer | Scope | Tool | What must be covered |
|---|---|---|---|
| API integration | Full Nest app built with the shared app setup function, real Mongo test database, HTTP via supertest | Vitest + SWC transform + supertest | Every `fixtures/validation-cases.json` row against signup and signin; signup 201 with cookie and `{ user }`; duplicate signup 409; concurrent duplicate signup (5 parallel, exactly one 201, one document); signin success and case-insensitive email; unknown email and wrong password give identical 401 bodies apart from `requestId`; `/auth/me` 200 with cookie and 401 for missing, malformed, bad-signature, `alg: none`, expired, and deleted-user tokens; cookie flags (HttpOnly, SameSite=Lax, Path=/, Max-Age, Secure when enabled); logout 204 clears the cookie and works without one; password and hash never in any response body; password, hash, cookie and authorization values never in captured log output; 429 past the limit with `Retry-After`; two forwarded client IPs limited independently; `/auth/me` never throttled; unknown field and URL-encoded body give 400; error shape on every error case; CORS allowed only for `WEB_ORIGIN`; `/docs` present outside production, 404 in production; DI smoke test |
| API unit | Env schema, DTOs | Vitest | Missing required vars rejected; `JWT_SECRET` under 32 characters rejected; `COOKIE_SECURE=false` in production rejected; every fixture row through the DTOs |
| Web unit | Zod schemas, error mapping | Vitest (node environment) | Every fixture row with the exact §4 message; 400, 401, 409, 429, 5xx and network failure map to the §8 displays |
| E2E | Both apps as production builds, test database | Playwright (Chromium) | Signup lands on `/app` with the welcome text; logout returns to `/signin` and `/app` then redirects; signin with the created account; wrong password shows the generic error; client-side validation messages on bad input; signed-in visits to `/signin` and `/signup` redirect to `/app`; no console errors |

**Test database isolation**
- Tests read only `TEST_MONGODB_URI`. Each suite's global setup refuses to run unless the database name ends in `_test` and the URI differs from `MONGODB_URI`.
- Collections are cleared with deletes between tests (indexes survive). Test files run serially against the shared database.
- E2E starts the API with `MONGODB_URI` set to the test URI and clears `users` before the run.
- CI provides `mongo:8` as a service container with database `auth_test`.

## 10. Security
- **Rate limiting:** signup and signin, 10 requests per 60 s per client IP and per route (each has its own budget), in-memory store; IPv6 clients are grouped by /64. Client IP comes from the forwarded-for header with exactly `TRUST_PROXY_HOPS` (1) trusted. The Next.js rewrite does not add `X-Forwarded-For`: it passes the client's header through unchanged (verified in 0.4). So per-client limiting needs an edge proxy in front of the web app that appends the client address; without one, every user shares one bucket, and a client that sets its own header can choose its key. Locally that only affects development. `/auth/me` and logout are not limited, because Next.js calls `/auth/me` server-to-server on every protected render.
- **Helmet:** defaults on the API. JSON endpoints keep the default CSP. Swagger UI at `/docs`, which exists only outside production, also runs under the default CSP: Swagger UI 5 loads its scripts from files, so no relaxation is needed (verified in a browser in 3.1).
- **Web headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, set in Next.js config. A nonce-based CSP for the web app is deferred.
- **CORS:** origin exactly `WEB_ORIGIN`, credentials allowed, methods GET and POST. Normal traffic is same-origin through the rewrite; CORS matters only for direct API calls.
- **Cookie:** `access_token`, HttpOnly, SameSite=Lax, Path=/, Max-Age equal to the token lifetime, Secure in production. Never readable from JavaScript; never in a response body.
- **JWT:** HS256 pinned on verify; claims `sub`, `iat`, `exp` only; 30 s clock tolerance.
- **CSRF:** SameSite=Lax withholds the cookie on cross-site POSTs; the API accepts JSON bodies only, which a cross-site form cannot send without a failing CORS preflight; no state-changing GET exists. No CSRF token.
- **Enumeration and timing:** signin returns one generic 401 and runs a dummy argon2 verify for unknown emails. Signup's 409 reveals that an email is registered; accepted because the brief has no email verification, and mitigated by the rate limit.
- **Passwords:** argon2id with library defaults; the 128-character maximum bounds hashing cost; the hash field is excluded from queries by default and from every response.
- **Secrets:** only in `.env` files, which are gitignored. `.env.example` holds placeholders. No default `JWT_SECRET`. CI uses a non-secret test value in the workflow file.
- **Log redaction:** request `cookie` and `authorization` headers, response `set-cookie` header, any `password` or `passwordHash` path. Request bodies are not logged. Logs reference users by id, never email.
- **Swagger:** mounted only when NODE_ENV is not production; documents the cookie auth scheme.