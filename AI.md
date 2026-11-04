<!-- AI.md -->
# AI Usage

This project was built with Claude Code under a spec-driven workflow. The spec in `docs/`
(architecture, ADRs, roadmap) was drafted with AI in a gated session and reviewed at each
gate. Each build task then ran: `researcher` subagent (docs via context7) → plan → owner
approval → implementation → tests and a real-browser check (Playwright MCP) →
`governance-reviewer` subagent → commit with code, docs and the entry below. Entries are
written per task, in the task's commit, never reconstructed afterwards.

## Summary
Written in task 4.2 from the entries below. Each point cites task IDs.

### 1. Which parts were AI-assisted
### 2. Prompts and approaches that worked well
### 3. What had to be corrected or reworked
### 4. Where decisions differed from the AI's suggestion
### Time: estimated vs actual

## Per-task entries

### Entry format
Copy this block for each task, in roadmap order.

```
### <task id> <task title>
- Date / time spent: <date>, <minutes> (estimate <minutes>)
- AI-generated: what the AI produced (files, tests, config)
- Prompt or approach: what was asked and how (researcher first, plan gate, etc.)
- Verified by: tests, Playwright MCP check, reviewer verdict (PASS / FLAG / BLOCK)
- Corrected or reworked: what was wrong in the AI output and how it was fixed
- Differed from AI suggestion: decisions the owner made against the AI, with the reason
```

### S Spec session (architecture, ADRs, roadmap)
- Date / time spent: 2026-11-03, about 15 min of review across four gates
- AI-generated: requirements extraction, risk register, `docs/architecture.md`, nine ADRs, `docs/execution-roadmap.md`, `.env.example` files, this skeleton, `docs/future-improvements.md`
- Prompt or approach: a phased prompt (discovery, blueprint, decomposition, emit) with a hard stop at each gate and a recommended default for every open question
- Verified by: owner review at each gate; the AI's self-audit checklist before emitting files
- Corrected or reworked: the AI's own Phase 3 estimate (about 8 h) exceeded the time box; the owner cut reviewer runs on low-complexity tasks to recover about 40 min
- Differed from AI suggestion: none at spec stage; the owner confirmed Next.js satisfies the brief's React requirement and accepted the defaults

### 0.1 AI workflow
- Date / time spent: before 2026-11-03
- AI-generated: CLAUDE.md, `researcher` and `governance-reviewer` subagent definitions, MCP config, docs templates
- Prompt or approach: workflow files prepared ahead of the timed build
- Verified by: owner review
- Corrected or reworked: none recorded
- Differed from AI suggestion: none recorded

### 0.2 Workspace scaffold and tooling
- Date / time spent: 2026-11-03, about 13 min (estimate 35)
- AI-generated: root `package.json` (six scripts; `test` and `e2e` are placeholders that print "placeholder until task 0.5 / 3.2" and exit 0), `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.nvmrc` (24), `.gitignore` additions (`next-env.d.ts`, `*.tsbuildinfo`, `.DS_Store`); `apps/api` (`package.json`, `tsconfig.json`, `src/main.ts`, `src/app.module.ts`, ESM as Nest 12 generates it); `apps/web` (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`). Generated with `create-next-app@16.4.4` and `@nestjs/cli@12.0.11 new`, then pruned.
- CLI demo files removed: Nest `app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`, `test/app.e2e-spec.ts`, `vitest.config.ts`, `vitest.config.e2e.ts`, `tsconfig.build.json`, `nest-cli.json`, `.oxlintrc.json`, `.prettierrc`, `.gitattributes`, `AGENTS.md`, `README.md`, plus the Vitest, supertest, oxlint and `@nestjs/testing` dependencies; Next `public/*.svg`, `favicon.ico`, demo page markup, Geist font wiring, `README.md`, `.gitignore`, `pnpm-workspace.yaml`, and an `AGENTS.md` that `next dev` wrote on first start.
- Strict flags added by hand in `tsconfig.base.json`: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames` (`strict` was already on in both templates). Lint uses `typescript-eslint` `strictTypeChecked` with `projectService`.
- Prompt or approach: the plan was approved first. The `researcher` subagent and context7 are not configured (see 0.1), so a general-purpose subagent researched official docs via WebFetch instead. It ran in parallel with scaffolding; its findings were applied before the commit. Versions came from `npm view` on the day.
- Verified by: `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build` (run twice; neither tsconfig changed), `prettier --check .` all pass; `curl :4000/` returns Nest's JSON 404 in dev and from `node dist/main.js`; Chrome DevTools MCP (Playwright MCP is not configured) loaded `http://localhost:3000` with zero console errors; probe files (deleted afterwards) confirmed the cross-app import rule, react-hooks, react, `@next/next` and jsx-a11y rules all fire. Reviewer: `code-reviewer` subagent in place of the missing `governance-reviewer`, verdict FLAG; all findings addressed below.
- Corrected or reworked:
  - CLI defaults that contradicted the spec: `create-next-app` enabled `cacheComponents` and `partialPrefetching` (architecture §6 says Cache Components are off) and wired Tailwind through `@tailwindcss/turbopack` with no PostCSS config (§2 locks `@tailwindcss/postcss`); both replaced. Its `.gitignore` had `.env*`, which would have ignored `.env.example`; deleted in favour of the root file. `nest new` chose oxlint over ESLint (§2) and added Vitest configs (tests are 0.5); removed.
  - TypeScript pinned to `~6.0.3`: npm `latest` is 7.0.2, but `typescript-eslint` 8.72.1 requires `<6.1.0` and the Nest CLI bundles 6.0.
  - ESLint: the AI first pinned ESLint 9 to silence peer warnings from `eslint-config-next`'s bundled plugins, then moved back to 10 after research showed Next 16.4 supports ESLint 10 and ESLint 9 is out of support; the remaining peer warnings are cosmetic and every rule set was observed working.
  - pnpm: the AI first added an `onlyBuiltDependencies` list; research showed it is deprecated in pnpm 10.26+ (`allowBuilds`), and a clean install showed no dependency needs a build script, so the list was dropped.
  - Reviewer finding: the cross-app import rule's bare `api` pattern also blocked `@/lib/api` (the future web API client in §3); narrowed to exact package names plus `apps/<other>` paths and re-probed.
  - Removing the demo favicon caused a `/favicon.ico` 404 console error; `layout.tsx` metadata now declares an empty icon.
  - `engines.node` raised to `>=24.15.0`, the Nest CLI schematics minimum found in research.
- Differed from AI suggestion: none; the owner accepted the recommended tool substitutions, the TypeScript pin, pnpm 10.33.0 and Node 24.


### 0.3 Local Mongo and API config
- Date / time spent: 2026-11-03, about 20 min including a wait for a port conflict (estimate 25)
- AI-generated: `docker-compose.yml` (`mongo:8`, named volume `mongo-data`, `mongosh` ping health check, bound to `127.0.0.1:27017`); root `dev` script (`docker compose up -d --wait mongo`, then both apps); `apps/api/src/config/` (`env.schema.ts` class-validator schema, `env.validate.ts` with defaults and the production cookie rule, `index.ts`); `app.module.ts` (`ConfigModule.forRoot` with `validate`, `MongooseModule.forRootAsync`); `main.ts` (port from config, clean exit 1 on failed boot); `apps/api/.env.example`; one sentence added to the §7 `JWT_SECRET` purpose.
- Prompt or approach: the env rules were specified as a table in the plan, one row per §7 api variable (rule, required or optional, default), and approved at the env gate before any code was written. No researcher in this task's roadmap row; the two library behaviours the plan relied on were checked in the published package source (`@nestjs/mongoose` retry defaults, `@nestjs/config` 12 `forRoot` being async and `validate` errors propagating unchanged).
- Forbidden defaults: none added. `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET` and `WEB_ORIGIN` have no fallback; an empty environment fails naming exactly those four. Optional defaults are the §7 values (`PORT` 4000, `JWT_TTL_SECONDS` 3600, `COOKIE_SECURE` true only in production, `TRUST_PROXY_HOPS` 1, throttle 10 per 60 s, `LOG_LEVEL` info).
- Verified by: by hand with `env -i` and sentinel values: a 10-character `JWT_SECRET` exits 1 naming only `JWT_SECRET`; `NODE_ENV=production COOKIE_SECURE=false` exits 1 naming only `COOKIE_SECURE`; the §7 placeholder secret, blank, `1e3`, `0x10`, padded and whitespace values all fail by name; no sentinel value ever appeared in output, including credentials and options inside `MONGODB_URI`; `pnpm dev` brought Mongo to healthy, then the api (Nest 404 on :4000) and web (200 on :3000); with Mongo stopped the api exited 1 after 5.3 s; `pnpm lint`, `pnpm typecheck`, `prettier --check` pass. Reviewer: `code-reviewer` in place of the missing `governance-reviewer`, verdict FLAG; findings fixed below.
- Corrected or reworked:
  - Found in planning, before code: `@nestjs/mongoose` retries 9 times with a 3 s delay by default, so Mongo down would have taken about 30 s, not 5 s; set `retryAttempts: 0` with `serverSelectionTimeoutMS: 5000`. Nest's default `abortOnError` ends a failed boot with `process.abort()` (exit 134); `main.ts` sets it to false and exits 1.
  - Found in planning: the §7 example `JWT_SECRET` (63 characters, not the 64 its text says) passes the 32-character rule, so a copied `.env.example` would boot with a public secret. The owner approved rejecting that exact value and documenting it in §7.
  - Reviewer: `@Type(() => Number)` turned a blank `TRUST_PROXY_HOPS=` into 0 hops and accepted `1e3` and `0x10`; replaced with a digits-only transform. A 32-space `JWT_SECRET` passed; whitespace is now refused. Nest printed the full Mongo error object (topology dump, URI options); a `connectionErrorFactory` now keeps name and message only.
  - The AI's first sanitiser assigned `name` on a `MongooseError`, which is read-only, so boot failed with a `TypeError`; caught by the timed Mongo-down run and fixed.
  - The AI's first boot-check harness relied on shell word-splitting that zsh does not do, so the checks ran without the base variables; rerun under bash. A grep for leaked values gave a false positive by matching `apps/api` in stack paths; rerun with unique sentinels.
- Differed from AI suggestion: none. The owner accepted every recommendation: stop the unrelated container on 27017 rather than move the port, reject the placeholder secret, list `TEST_MONGODB_URI` in `.env.example` without validating it at boot.


### 0.5 Test harness
- Date / time spent: 2026-11-03, about 70 min wall-clock (estimate 25). About 56 min of that was a `pnpm install --force` the AI started only to re-check a pnpm warning, which hit a very slow registry; hands-on work was about 20 min. Lesson: don't force a full reinstall to answer a cosmetic question.
- AI-generated: `apps/api/vitest.config.ts` (unplugin-swc, global setup, per-file guard, `fileParallelism: false`, fixed `test.env`, 15 s timeouts); `apps/api/test/setup/` (`test-db.ts` rules, `global-setup.ts` guard, `worker-guard.ts`, `app-factory.ts` stub, `cleanup.ts`); `apps/api/test/config.spec.ts` (12 tests); `apps/api/test/di-smoke.spec.ts` (DI through constructor metadata; factory boot on the test DB; cleanup deletes without dropping); `apps/api/test/tsconfig.json`; `apps/web/vitest.config.ts` (node, `passWithNoTests`); scripts (`pnpm -r test`, per-app `vitest run`, api typecheck now covers `test/`); ESLint `allowDefaultProject` for the api Vitest config; `allowBuilds: { '@swc/core': false }`.
- Did the first config emit decorator metadata? Yes, unexpectedly. The first config had no SWC, and the DI smoke test passed under Vite 8's default Oxc transform, which reads `emitDecoratorMetadata` from tsconfig. To prove the test can fail, it was rerun with Oxc metadata explicitly off: it failed with `expected undefined to be an instance of Dependency`. SWC was added anyway: architecture §2 locks it, and research found Oxc's metadata support is partial (falls back to `Object` for some types).
- Prompt or approach: no `researcher` subagent or context7 (see 0.1), so a general-purpose subagent researched official sources (vitest.dev timed out; it read the Vitest docs and source on GitHub). Key findings used: Vitest 5 no longer looks for config in parent directories; a throwing global setup aborts before files are collected (from source, then confirmed by running it); `process.env` set in global setup reaches workers; `test.env` is not visible in global setup; `fileParallelism: false` for serial files; unplugin-swc disables Vite's own TS transform itself. Plan approved before code.
- Verified by: `pnpm test` green (api 14 tests, web passes with no tests) with `TEST_MONGODB_URI=…/auth_test`. With `TEST_MONGODB_URI` pointed at `auth_dev`, set equal to `MONGODB_URI`, or unset, the run aborts with a named reason and zero test results, and no URI is printed. Afterwards `auth_test` held only the empty probe collection and no `auth_dev` database existed. `@swc/core` works without its blocked postinstall. `process.loadEnvFile`/`parseEnv` precedence checked with throwaway files outside the repo. `pnpm lint`, `pnpm typecheck`, `pnpm build`, `prettier --check` pass. Reviewer: `code-reviewer` in place of `governance-reviewer`, verdict FLAG; all findings fixed.
- Corrected or reworked:
  - The AI's first `clearDatabase` used `connection.collections`, which only lists collections Mongoose registered; switched to the database's real collection list before review.
  - Reviewer: the web include glob was `*.test.ts` while the roadmap names `*.spec.ts` files, so with `passWithNoTests` the web suite would have silently run nothing; fixed. `clearDatabase` now refuses a database not ending in `_test`, and the factory checks the connected name, independent of the env guard. Global setup copied the whole dev `.env` into workers, so local throttle or cookie settings could change test behaviour versus CI; it now takes only `TEST_MONGODB_URI` and `MONGODB_URI`. The factory closes the app if init fails. Timeouts are raised above the 5 s Mongo timeout.
  - `allowBuilds: { '@swc/core': false }` records the decision, but pnpm 10.33 still prints the "ignored build scripts" notice for it.
- Differed from AI suggestion: none; the owner accepted the recommendations (exercise the factory and cleanup against the test DB, rewrite `MONGODB_URI` in test processes, the extra lint/typecheck files).


### 2.0 Design reference and theme
- Date / time spent: 2026-11-04, about 20 min (unplanned task, no estimate)
- AI-generated: `docs/design/auth-app-v2.dc.html` (copy of the Claude Design file "Auth App v2.dc.html"), `docs/design/README.md` (theme tokens, mapping of each design element to roadmap tasks 2.3 to 2.5, deviations); Tailwind v4 `@theme` colour tokens, a `brand-mark` utility and base styles in `apps/web/src/app/globals.css`; Plus Jakarta Sans via `next/font/google` in `layout.tsx`; a themed placeholder `page.tsx`; roadmap row 2.0, an M2 note pointing to the design, and the 2.3 expected output amended for the profile card; two rows in `docs/future-improvements.md`.
- Prompt or approach: the owner asked to implement the design. The AI read it through the Claude Design MCP and stopped before coding, because the design is the whole M2 frontend and the backend it needs (0.4, 1.4, 1.5, 1.7) does not exist yet. It listed the conflicts with the spec and recommended a reference plus theme now, with the screens built inside 2.2 to 2.5. The owner approved.
- Verified by: `pnpm lint`, `pnpm typecheck`, `pnpm --filter web build`, `prettier --check` pass; Chrome DevTools MCP (Playwright MCP is not configured) loaded `http://localhost:3000`: computed body background, text colour, brand-mark colours and radius match the tokens, Plus Jakarta Sans reported loaded, zero console errors or warnings. No reviewer (L).
- Corrected or reworked: nothing reworked in code. Conflicts found in the design and resolved in favour of the architecture (recorded in `docs/design/README.md`): client-state routing with a fake login (replaced by the §5 routes); "Incorrect email or password." (§4/§8 say "Invalid email or password"); a single generic password error (§4 shows the first failing rule); a looser email regex without the length limits. The AI also dropped the card's "Signed in at" and "Session: Active" rows because the API does not provide them.
- Differed from AI suggestion: none; the owner accepted all recommendations (reference now, screens in their tasks, defer the Arabic/RTL toggle and the toast, keep the profile card and relax 2.3's "exactly", spec copy wins).


### 2.0b Visual preview of the M2 screens
- Date / time spent: 2026-11-04, about 15 min (unplanned, no estimate)
- AI-generated: `/signin`, `/signup` and `/app` pages and the `/` redirect; components `auth-shell`, `auth-hero`, `auth-tabs`, `brand-mark`, `check-icon`, `field-styles`, `form-field`, `password-field`, `password-rules`, `form-alert`, `submit-button`, `signin-form`, `signup-form`, `logout-button`, `preview-banner`. File names follow the 2.3 to 2.5 specs so those tasks wire these files rather than rebuild them.
- Prompt or approach: after 2.0 the owner saw only the placeholder and asked for the screens now. The AI had offered a visual-only build as the option the owner set aside earlier, and built it on request: design layout and visuals, spec copy, no API calls. Pages are Server Components; `'use client'` is only on the two forms, the password field and the logout button. The tabs are links between routes (§5). The live password checklist uses the §4 ASCII definitions, not the design's Unicode ones.
- Verified by: `pnpm lint`, `pnpm typecheck`, `pnpm --filter web build`, `prettier --check` pass. Chrome DevTools MCP (Playwright MCP is not configured): `/` redirects to `/signin`; all three pages render as in the design at 1440 px; the checklist ticks live as a password is typed; the signin submit shows the preview notice in the form alert; none of the three pages scrolls horizontally in a 320 px frame; no console errors or warnings. No reviewer (L).
- Corrected or reworked: the AI's first `/app` details grid used the design's auto-fit columns, which put three details in a row and left one alone (the design had six details, the API gives four); changed to 2×2. The password field's accessible description read only "Password requirements" (the list's `aria-label`) instead of the rule text; the label was removed so the rules themselves describe the field. React 19.3 types deprecate `FormEvent`; switched to `SubmitEvent`.
- Differed from AI suggestion: the AI recommended building the screens inside 2.2 to 2.5 against the real API; the owner chose to see them now as a preview. The cost is some rework when 2.4 and 2.5 swap the local state for React Hook Form.


### 1.1 API app setup, logging and errors
- Date / time spent: 2026-11-04, about 45 min (estimate 30)
- AI-generated: `apps/api/src/common/` (`app-setup.ts` shared by `main.ts` and tests: request-id middleware, Helmet, CORS, cookie parser, JSON-only 10 KB body, trust proxy, ValidationPipe, filter; `errors/` codes, `AppException`, validation-error factory; `filters/all-exceptions.filter.ts`; `logging/` nestjs-pino module with serializers, redaction, error scrubbing and an overridable log destination for tests); `main.ts` (`bodyParser: false`, `bufferLogs`); test factory upgraded to the shared setup with log capture; `test/common/app-setup.spec.ts` (14 tests); §8 note on 400/413/415. All M1 dependencies were installed here (`allowBuilds: argon2: true`).
- Redaction paths vs §10 and request bodies: research showed pino's default request serializer logs every header (cookie and authorization included) plus the query string, and the response serializer logs `set-cookie`. So the AI did not rely on redaction alone: custom serializers emit only id, method, path (query stripped) and status, and the §10 paths (`req.headers.cookie`, `req.headers.authorization`, `res.headers["set-cookie"]`, `password`/`passwordHash` at several depths) are redacted as a backstop. Request bodies were never logged (pino-http does not by default, and the serializers drop them).
- Prompt or approach: one general-purpose research pass covered 1.1, 1.6 and 1.8 up front (researcher and context7 are not configured). Findings used: Express 5 turns body-parser failures into HttpExceptions before filters; `bodyParser: false` plus `useBodyParser('json')` is the only way to drop the URL-encoded parser; a named throttler sends `Retry-After-<name>`, so 1.8 will use the default name.
- Verified by: `pnpm test` (28 tests with 1.1 alone), `pnpm lint`, `pnpm typecheck`, `pnpm build`; a built API on port 4100 with `.env` logged id, method, path and status only, and none of the cookie, authorization or query sentinels sent. Reviewer: `code-reviewer` in place of `governance-reviewer`, verdict FLAG; fixed below.
- Corrected or reworked:
  - CORS: `origin` as a string makes `cors` send that origin to every caller; switched to a one-item list so other origins get no header (caught by the first test run).
  - Reviewer: errors raised before routing (invalid JSON, body over 10 KB, bad URL) had an empty `requestId` and no header, because the pino middleware runs after the body parser; the request id is now assigned in the first middleware and reused by pino-http. Unmapped HttpExceptions (415, 401) became 500; now 401 maps to `UNAUTHENTICATED` and other 4xx keep their status with `VALIDATION_FAILED`. Error logs could carry secrets from error text; an `err` serializer keeps type and a scrubbed stack. Added tests for each, plus 503 mapping and the validation-error shape.
  - The AI's first scrub test failed for two reasons it introduced: the filter logged the raw error message as the log line's `msg`, outside the scrubbed field (now a fixed message), and its email pattern was loose enough to mangle pnpm store paths in stack traces (now strict email syntax).
  - The AI started 1.2 and 1.3 files while 1.1 was in review and briefly wired `UsersModule` into `app.module.ts`; it backed that out and stashed the work so the 1.1 commit was verified on its own. A first attempt to isolate the files with `mv` hit a name clash and was redone with `git stash`; no files were lost.
- Differed from AI suggestion: none.


### 1.2 Users module
- Date / time spent: 2026-11-04, about 15 min (estimate 15)
- AI-generated: `apps/api/src/users/` (`User` schema with a unique email index, `select: false` hash, timestamps, no version key; `UsersService` with `create`, `findByEmailWithHash`, `findById`, `toPublicUser`; typed `DuplicateEmailError`; `UsersModule` awaiting `model.init()` at boot); `test/users/users.service.spec.ts` (8 tests); `UsersModule` registered in `AppModule`.
- Pre-check or index, and the init await: the AI relied on the unique index and Mongo error 11000 from the start, with no pre-check query, and awaited `model.init()` in `onModuleInit` so the API cannot serve before the index exists. No fix was needed there.
- Prompt or approach: the plan from the M1 planning session; written while 1.1 was in review, then wired into `AppModule` only after 1.1 was committed.
- Verified by: `pnpm test` (36 tests with 1.2 alone), `pnpm lint`, `pnpm typecheck`, `pnpm build`. Reviewer: `code-reviewer`, verdict FLAG; it also simulated an index-build failure and confirmed `init()` rejects rather than hanging.
- Corrected or reworked (all from review):
  - On duplicate data the index-build error names the duplicate email, and `main.ts` prints boot errors; boot now rethrows a generic message. A deterministic test makes `init()` fail and asserts the generic message without the email.
  - Boot relied on Mongoose's default `autoIndex: true`; `autoIndex` and `autoCreate` are now pinned on the schema.
  - The "index exists" test cannot fail on its own, because the test database (and so the index) persists between runs; the new boot-failure test covers the behaviour instead.
  - Noted for 1.4: `create()` returns a document that still holds the hash in memory (`select: false` only affects queries), so auth code must only ever return `toPublicUser(...)`.
- Differed from AI suggestion: none.
