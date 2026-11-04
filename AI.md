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
Nearly all of the code, tests, configuration and docs were AI-generated under owner review; the owner set scope, approved
every plan and env gate, and made the product calls.
- Spec and workflow: the architecture, ADRs and roadmap (S); the agent definitions and MCP config, which arrived late (0.1).
- Backend: app setup, logging and errors (1.1), users (1.2), the shared validation fixtures and DTOs (1.3), all four
  endpoints and rate limiting (1.4 to 1.8), Swagger (3.1).
- Frontend: the design import and theme (2.0, 2.0b), Zod parity schemas (2.1), the session helper and app shell (2.2),
  and the three screens (2.3 to 2.5).
- Tooling and delivery: scaffold (0.2), Mongo and env validation (0.3, 0.4), test harness (0.5), CI (0.6), e2e (3.2),
  README (4.1).

### 2. Prompts and approaches that worked well
- **Plan, then gate.** Each task started from its roadmap spec with a written plan and an explicit owner approval;
  env changes were listed before they were applied (0.3, 0.4, 0.6).
- **Research the installed version, not memory.** Reading the installed package or its source caught real version
  changes: Vitest 5 config lookup and global setup (0.5), Express 5 body-parser errors and pino's default serializers
  logging every header (1.1), passport-jwt's option merging (1.6), the throttler's `Retry-After-<name>` (1.8), the
  Next.js rewrite adding no `X-Forwarded-For` (0.4), MongoDB 8's kernel check (0.6).
- **An independent reviewer on every non-trivial task.** Almost every FLAG was a real defect (see 3 below).
- **Sentinel values in tests.** Unique strings sent as secrets, cookies or URIs proved names-only errors and redacted
  logs (0.3, 1.1, 1.4, 0.4).
- **One shared fixture file for both validators.** It caught a web/API disagreement no one had written a rule for
  (1.3, 2.1).
- **Verify in a real browser and against production builds** before ticking a frontend task (2.2 to 2.5, 3.1, 3.2).

### 3. What had to be corrected or reworked
- **Security and privacy defects found by review or tests:**
  - errors before routing had no request id (1.1);
  - the error log could carry secrets, and a scrubber of the AI's own was too loose (1.1);
  - the index-build error printed an email at boot (1.2);
  - unknown-email signins could return 500 and reveal accounts (1.5);
  - a database outage during the session check looked like a sign-out (1.6);
  - the IPv6 rate-limit key could be rotated (1.8);
  - a bad `API_URL` was printed in the build output (0.4);
  - a non-ASCII cookie trapped users on the error page (2.2);
  - CORS echoed the allowed origin to every caller (1.1).
- **Correctness:**
  - validation messages came out in reverse order (1.3);
  - blank numeric env values became 0 (0.3);
  - Zod counted emoji differently from the API (2.1);
  - a corrected field kept its error (2.4);
  - double submit was possible during navigation (2.4);
  - a failed logout bounced users back to `/app` (2.3);
  - Swagger documented a 503 that logout cannot return (3.1).
- **Tooling and process:**
  - CLI defaults contradicted the spec: Cache Components on, the wrong Tailwind plugin, and a `.gitignore` that would have hidden `.env.example` (0.2);
  - the test DB cleanup missed unregistered collections (0.5);
  - `pnpm lint` broke after e2e builds (3.2);
  - a forced reinstall cost 56 minutes (0.5);
  - one task commit went out without its entry (3.2);
  - row 0.1 was ticked without its files (0.1 completed).

### 4. Where decisions differed from the AI's suggestion
- **Visual preview before the API (2.0b).** The AI recommended building the screens inside 2.2 to 2.5 against the real
  API; the owner asked to see them first, accepting some rework.
- **Mongo port (0.3, then the follow-up).** The AI first recommended stopping the other project's container on 27017;
  after the conflict recurred, the owner asked for a lasting fix and the port moved to 27018.
- **Repository visibility (4.3).** The owner kept the final step of making the repo public for themselves.
- **Everything else followed the AI's recommendations** after the owner reviewed them: deferring the Arabic toggle
  and toast (2.0), the CSP and docs decisions (3.1), and the tool stand-ins while the agents were missing (0.2 to 3.2).

### Time: estimated vs actual
- **Estimated tasks:** 21 tasks with an estimate came to 543 min actual against 455 min estimated (+19%).
  - About 56 min of the overrun was one avoidable forced reinstall on a slow registry (0.5).
  - Without it, actual was 487 min (+7%).
- **Unplanned or unestimated work:** about 75 min more. That covers the spec review (S), the design reference and
  preview (2.0, 2.0b), completing 0.1, and the open-items follow-up.
- **Biggest overruns:** 1.1 (+15), 2.4 (+15), 3.1 (+15), 1.3 (+10), 0.4 (+10), 0.6 (+10). Each was driven by review
  fixes or a platform surprise rather than the first draft.
- **Under estimate:** 0.2 (-22), 1.4 (-10), 1.6 (-5).
- **Not included:** 4.2 and 4.3, whose times are in their own entries.

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


### 1.3 Validation fixtures and API DTOs
- Date / time spent: 2026-11-04, about 30 min (estimate 20)
- AI-generated: `fixtures/validation-cases.json` (103 rows: base bodies plus one row per case, with `omit`, `input`, `valid`, first failing `message`, `normalized` and `apiOnly`); `apps/api/src/auth/validators/rules.ts` (one decorator per §4 row, ranked); `apps/api/src/auth/dto/` (`SignupDto`, `SigninDto`, normalization transforms, §4 messages); `test/auth/fixtures.ts` loader and `test/auth/dto.spec.ts` (every row plus multi-failure ordering cases); the validation-error factory now orders messages by rule rank; two §4 sentences.
- Where the AI's email or special-character logic disagreed with §4: none in the first draft. The email rule is a custom pattern, not class-validator's `isEmail`; letters are ASCII only, special is anything but an ASCII letter, a digit or whitespace. Two §4 gaps were filled and documented in §4 so the web suite follows them: a field is present only if it is a string that is not empty after normalization (a blank form field reads as required), and a missing field reports only its required message. The reviewer asked for whitespace and length to be defined too: whitespace is JavaScript's `\s` (what trimming removes, NBSP included) and lengths are JavaScript `length` (UTF-16 code units).
- Boundary rows added by hand: password 7/8 and 128/129, name 2/3 and 50/51 after trimming, email 254/255, `é` counts as special, a space never counts, padded uppercase email normalizes, unknown field rejected (the roadmap list). Added after review: email 254/255 after normalizing (258 typed), NBSP in an email local part and as padding, NBSP never special, a whitespace-only password (fails signup, valid on signin), 25/26 emoji names (50/52 code units), a 129-character password with no letter.
- Prompt or approach: fixtures generated by a one-off script outside the repo so long boundary strings are exact; only the JSON is committed.
- Verified by: `pnpm test` (147 tests with 1.3 alone), `pnpm lint`, `pnpm typecheck`, `pnpm build`. Reviewer: `code-reviewer`, verdict FLAG; it ran email edge cases (no false accepts or rejects, no ReDoS) and the findings are fixed above and below.
- Corrected or reworked: the first run failed the three multi-failure cases because TypeScript applies decorators bottom-up, so class-validator recorded messages in reverse table order. The AI first reversed the list in the factory; the reviewer pointed out that relies on undocumented insertion order, so each rule now carries a rank in its constraint name and the factory sorts by it. More multi-failure cases are pinned (email max then format, password max then number then special, signin max only). Character counting first used string spread (code points); switched to `length` so the API counts like Zod on the web. The fixtures' unknown-field rows now carry `apiOnly` instead of a free-text note.
- Differed from AI suggestion: none.


### 1.4 `POST /auth/signup`
- Date / time spent: 2026-11-04, about 20 min (estimate 30)
- AI-generated: `apps/api/src/auth/` (`AuthModule` with `JwtModule` HS256, `AuthController` HTTP only, `AuthService.signup` hashing with argon2id and mapping `DuplicateEmailError` to 409 `EMAIL_TAKEN`, `cookie.ts` with one attribute set for issuing and clearing); `test/auth/signup.spec.ts` (73 tests: every signup fixture row over HTTP, the 5-way race, cookie flags with `COOKIE_SECURE` false and true, token claims, no password, hash or token in bodies or logs, URL-encoded body); a `config` override option in the test factory; every optional §7 value pinned in `vitest.config.ts`.
- 11000 or a pre-check, and cookie attributes: the AI mapped the duplicate from the unique index (via the 1.2 typed error) with no pre-check query. Cookie attributes needed no correction: HttpOnly, SameSite=Lax, Path=/, Max-Age equal to `JWT_TTL_SECONDS` (Express takes milliseconds, the header shows seconds), Secure from `COOKIE_SECURE`.
- Prompt or approach: per the M1 plan; written while 1.3 was in review and wired into `AppModule` after the 1.3 commit.
- Verified by: `pnpm test` (220 tests with 1.4 alone), `pnpm lint`, `pnpm typecheck`, `pnpm build`; the 5 parallel signups gave one 201, four 409 and one document. Reviewer: `code-reviewer`, verdict PASS; it decoded a real token (header HS256, payload `sub`, `iat`, `exp` only, 3600 s).
- Corrected or reworked: `ConfigModule` reads the environment once when `AppModule` is defined, so a per-test `COOKIE_SECURE` could not come from `process.env`; the test factory now replaces the `ConfigService` with one built from validated env plus overrides. Review notes applied: the claims and HS256 header are now asserted in a test, the log test also asserts the token is absent and that logs were captured, and all optional env values are pinned for tests because `ConfigModule` also reads the developer's `apps/api/.env`.
- Differed from AI suggestion: none.


### 1.5 `POST /auth/signin`
- Date / time spent: 2026-11-04, about 20 min (estimate 20)
- AI-generated: `AuthService.signin` and the `POST /auth/signin` route; `password-hasher.ts` (an injectable argon2id wrapper used by signup and signin, with the dummy verify); `test/auth/signin.spec.ts` (45 tests: every signin fixture row, mixed-case email, identical unknown-email and wrong-password bodies, one argon2id verify on both paths, malformed stored hash, passwords never trimmed); the password-hashing ADR wording.
- Distinct errors for unknown email and wrong password: no. The first draft already returned one 401 `INVALID_CREDENTIALS` "Invalid email or password" for both, with no cookie, and ran a dummy verify for unknown emails.
- Prompt or approach: per the M1 plan. Hashing moved behind `PasswordHasher` because `argon2` is CommonJS and its ESM namespace cannot be spied on; the spec's spy test needs an observable call.
- Verified by: `pnpm test` (265 tests with 1.5 alone), `pnpm lint`, `pnpm typecheck`, `pnpm build`. Reviewer: `code-reviewer`, verdict FLAG; fixed below.
- Corrected or reworked (from review): the dummy hash started as an empty string filled at module init, and verifying against an empty hash throws, so an unknown email could return 500 where a wrong password returns 401; it is now built lazily and cached. A malformed stored hash also made argon2 throw, giving a 500 that confirms the account exists; `verify` now returns false and logs a warning (tested). The spy test now asserts an argon2id hash is verified on the unknown-email path and one verify on the wrong-password path; a positive test shows a password registered with spaces signs in only with them. The ADR said the dummy verify uses "a fixed hash"; it now says a hash of a random secret generated once per process.
- Differed from AI suggestion: none.


### 1.6 JWT guard and `GET /auth/me`
- Date / time spent: 2026-11-04, about 20 min (estimate 25)
- AI-generated: `jwt.strategy.ts` (passport-jwt reading only the `access_token` cookie, HS256 pinned, 30 s tolerance, user loaded by `sub`), `jwt-auth.guard.ts`, `jwt.constants.ts` (now the single home of the algorithm and tolerance), the guarded `GET /auth/me`, `test/auth/me.spec.ts` (14 tests); one shared `UNAUTHENTICATED_MESSAGE`.
- Researcher findings on cookie extraction: passport-jwt has no cookie extractor, so a small function reads `req.cookies.access_token` (cookie-parser from 1.1) and nothing else; an Authorization header is ignored (tested). passport-jwt builds its verify options as `assign({}, jsonWebTokenOptions, { audience, issuer, algorithms, ignoreExpiration })`, so `algorithms` must be top level or it is overwritten, and `clockTolerance` can only go in `jsonWebTokenOptions`, which the typings mark deprecated (a targeted lint exception with the reason).
- Algorithm-pinning correction: none needed; the first draft pinned HS256 at the top level. Tests reject `alg: none`, HS512 signed with the right secret, and a wrong signature.
- Verified by: `pnpm test` (278 tests with 1.6 alone), `pnpm lint`, `pnpm typecheck`, `pnpm build`. Reviewer: `code-reviewer`, verdict FLAG; fixed below.
- Corrected or reworked: the reviewer found the guard turned every error into a 401, so with Mongo down during the session check `/auth/me` returned 401 instead of 503 (§8). Because the web app calls `/auth/me` on every protected render, an outage would have looked like a sign-out. Token problems arrive as `user === false` with no error, so the guard now rethrows real errors and keeps the 401 for the rest; a test forces a server-selection error and expects 503. The tolerance tests now pin the boundary at 25 s (200) and 35 s (401). The 401 message was defined twice; now one constant.
- Differed from AI suggestion: none.


### 1.7 `POST /auth/logout`
- Date / time spent: 2026-11-04, about 10 min (estimate 10)
- AI-generated: the `POST /auth/logout` route (204, `clearAuthCookie` from 1.4); `test/auth/logout.spec.ts` (5 tests: clearing attributes equal the issuing ones apart from lifetime, Max-Age 0, with and without an incoming cookie, with an invalid cookie, `/auth/me` 401 afterwards through a cookie-keeping agent, Secure under `COOKIE_SECURE=true`).
- Guarded or anonymous: the AI made it anonymous from the start, as §5 specifies, so a user with an expired or missing cookie can always log out; no change was needed.
- Prompt or approach: tests written while 1.6 was in review; the route added after the 1.6 commit. Issuing and clearing share one attribute builder, so they cannot drift.
- Verified by: `pnpm test` (283 tests), `pnpm lint`, `pnpm typecheck`, `pnpm build`. No reviewer (L).
- Corrected or reworked: none.
- Differed from AI suggestion: none.


### 1.8 Rate limiting on signup and signin
- Date / time spent: 2026-11-04, about 20 min (estimate 20)
- AI-generated: `ThrottlerModule.forRootAsync` in `AppModule` (one unnamed throttler, limit and window from config, in-memory store); `common/throttle/client-ip-throttler.guard.ts` on signup and signin only; `test/auth/throttle.spec.ts` (6 tests with a limit of 3); a high test default for `THROTTLE_AUTH_LIMIT` so other suites are not throttled; §10 now says the limit is per route and IPv6 is grouped by /64.
- Researcher findings on the throttler's options (from the up-front 1.1 research pass): named throttlers send `Retry-After-<name>`, so the throttler is unnamed to send the plain `Retry-After` §4 requires; ttl is in milliseconds; the guard can be bound per route without `APP_GUARD`; the default tracker is `req.ip` with IPv6 masked to /64 since 6.7.0.
- The proxy-IP keying risk and how the test proves it fixed: behind the Next.js proxy every request comes from the proxy, so keying on the socket address would throttle all users together, and trusting every forwarded entry would let a client pick its own key. Express trusts exactly `TRUST_PROXY_HOPS` (1) hops, so the key is the entry the proxy appended. Tests: two different forwarded IPs are limited independently, and a spoofed left-most `X-Forwarded-For` entry does not change the key; `/auth/me` and logout stay unthrottled past the limit.
- Verified by: `pnpm test` (289 tests), `pnpm lint`, `pnpm typecheck`, `pnpm build`. M1 end-to-end against the dev database with curl on port 4100: signup 201 with the cookie, `/auth/me` 200, logout 204, `/auth/me` 401, signin with an uppercased email 200, wrong password 401 "Invalid email or password", duplicate 409, bad body 400 with field errors, the 11th signin within 60 s 429 with `Retry-After: 60`; the log had 20 request lines and none of the password, cookie, token, email or hash. Reviewer: `code-reviewer`, verdict FLAG; fixed below.
- Corrected or reworked: the AI's tracker override returned the raw `req.ip`, which dropped the library's IPv6 /64 grouping, so one IPv6 client could rotate addresses for fresh buckets and defeat the signin limit. The guard now delegates to the library's tracker, and a test shows addresses in one /64 share a bucket while another /64 does not.
- Differed from AI suggestion: none.


### 0.4 Web config: env, rewrite, headers
- Date / time spent: 2026-11-04, about 25 min (estimate 15)
- AI-generated: `apps/web/src/lib/env.ts` (Zod schema: `API_URL` must be an http(s) origin; errors list names only); `apps/web/next.config.ts` (env validated on build and start, `/api/:path*` rewritten to `${API_URL}/:path*`, the three §10 headers on every route); `apps/web/.env.example`; `zod` 4.6.7. A gitignored `apps/web/.env.local` was created locally with the owner's approval at the env gate; not committed.
- Researcher findings on Next.js 16 rewrites (read from the installed 16.4.4 source) and what the AI assumed from older versions: the AI expected the rewrite proxy to append `X-Forwarded-For`, as reverse proxies do. It does not: Next forwards the client's headers (including `Cookie`) and the body, sets `x-forwarded-host`, copies the upstream response including every `Set-Cookie` unchanged, but adds no `X-Forwarded-For` and passes a client-sent one through untouched. Rewrites are read from the build output, so `API_URL` is fixed at `next build`. An unreachable API gives a plain-text 500, not the §4 shape. `next.config.ts` runs on both build and start after `.env*` files load, so throwing there stops both.
- Verified by:
  - `next build` fails naming only `API_URL` when it is missing, invalid, or has a path; `next start` fails the same way.
  - Production `next start` against a built API on separate ports: `/api/anything` returns Nest's §4 404 with a request id; `/signin` carries the three headers (proxied `/api` responses keep the API's stricter Helmet headers); a signup through the rewrite returns the API's `Set-Cookie` unchanged (HttpOnly, SameSite=Lax, Path=/, Max-Age=3600).
  - Forwarded-for pass-through, measured with the rate limiter: with no `X-Forwarded-For`, every request through Next shares one key (the 11th signin is 429); with a different client-chosen `X-Forwarded-For` on each request, 12 of 12 pass. So per-client limiting holds only when an edge proxy in front of Next appends `X-Forwarded-For`, as §7's production stance assumes. Raised with the owner; not changed in code.
  - `pnpm lint`, `pnpm typecheck`, `prettier --check`, `pnpm test`. No reviewer (L).
- Corrected or reworked: the AI's first origin check called `new URL()` inside a Zod refinement. Zod 4 still runs refinements after the URL check fails, so an invalid value threw a `TypeError` whose `input` printed the raw value in the build output and bypassed the names-only message. The refinement now catches and returns false; re-tested with sentinel values (not printed).
- Differed from AI suggestion: none.


### 2.1 Web Zod schemas with parity tests
- Date / time spent: 2026-11-04, about 15 min (estimate 15)
- AI-generated: `apps/web/src/lib/validation.ts` (`signupSchema`, `signinSchema` for React Hook Form; §4 messages; normalization; presence rule; the same email pattern as the API) and `apps/web/test/validation.spec.ts` (runs the 101 non-`apiOnly` rows of `fixtures/validation-cases.json`, asserting success and normalized values for valid rows, and for invalid rows that only that field fails with the §4 message first).
- Rows that failed on the first AI draft and why: one, `signup-name-26-emoji`. The draft used Zod's `.min()`/`.max()`, which count code points, so 26 emoji (52 UTF-16 code units) passed the 50-character limit while the API rejects them. §4 says lengths are JavaScript `length` (added after the 1.3 review), so all web length checks now compare `length` directly. Without that fixture row the two sides would have disagreed silently.
- Prompt or approach: rules mirrored from the API, not shared (architecture §3: the apps never import from each other); each field is a string with a required message for non-strings, normalized, then checked in §4 order so the first issue is the message the form shows.
- Verified by: `pnpm --filter web test` (102 tests), `pnpm lint`, `pnpm typecheck`, `pnpm --filter web build`. No reviewer (L).
- Corrected or reworked: the length fix above.
- Differed from AI suggestion: none.


### 2.2 API client, session helper and app shell
- Date / time spent: 2026-11-04, about 35 min (estimate 30)
- AI-generated: `apps/web/src/lib/session.ts` (`getSession()`: server-only, `cookies()`/`headers()`, `no-store` fetch of `API_URL/auth/me` with only the `access_token` cookie and forwarded-for, 5 s timeout; user on 200, null on 401 or no usable cookie, throw otherwise); `lib/errors.ts` (§8 form failure mapping) with `test/errors.spec.ts` (12 tests); `lib/api-client.ts` (same-origin `/api` POSTs returning a result instead of throwing); `lib/types.ts`; `/` as the session redirect; `error.tsx` (retry) and `not-found.tsx` in the design's style; the `server-only` package.
- Researcher findings on Next.js 16 async `cookies()` and redirects (from the docs bundled in the installed package): `cookies()` and `headers()` are async only (sync access removed in 16) and make the route dynamic by themselves; `fetch` is not cached by default but `cache: 'no-store'` states it; `redirect()` returns 307 and throws, so it must stay outside `try`; `error.tsx` now receives `retry` (stable since 16.3) alongside the older `reset`; Next sets `x-forwarded-for` to the socket address only when the client sent none.
- Client-side session check: the AI did not propose one; the session is learned only on the server through `/auth/me` (CLAUDE.md), and the browser never sees the token (`document.cookie` checked in the browser).
- Verified by: Chrome DevTools MCP (Playwright MCP is not configured) against a production build with its own API on separate ports: anonymous `/` gives 307 to `/signin`; a junk or non-ASCII cookie also goes to `/signin`; after an in-page signup through `/api`, `/` lands on `/app`; with the API stopped, `/` renders the error page with "Try again", and after restarting the API the retry lands on "Welcome to the application."; an unknown URL renders the 404 page. Console: only the browser's note of the 500 or 404 status and React's production notice for the caught Server Component error (digest only); nothing unhandled. `pnpm --filter web test`, `pnpm lint`, `pnpm typecheck`, web build. Reviewer: `code-reviewer`, verdict FLAG; fixed below.
- Corrected or reworked (from review): a cookie that is not header-safe after URL-decoding made the outgoing header invalid, was reported as "API unreachable", and kept the user on the error page with retry useless; tokens not shaped like a JWT now count as signed out. A 400 with no field errors and no message gave the user no feedback; it now falls back to the generic alert. The fetch had no timeout (now 5 s); unread bodies are cancelled; a 200 without a user now throws; `PublicUser` moved out of the browser client into a types module; the 429 text now always reads "N seconds" as in §8.
- Note: `getSession()` makes no API call without a cookie, so with the API stopped only users holding a cookie see the error page; anonymous users still reach `/signin`. The roadmap's "with the API stopped `/` renders the error page" holds for signed-in users.
- Differed from AI suggestion: none.


### 2.3 `/app` page and logout button
- Date / time spent: 2026-11-04, about 20 min (estimate 15)
- AI-generated: `apps/web/src/app/app/page.tsx` (session check with a redirect to `/signin`, the design's welcome heading and profile card from the real user; preview banner and sample data removed) and `components/logout-button.tsx` (client leaf: posts to `/api/auth/logout`, replaces history with `/signin`, disabled with a pending label, an error message if logout fails).
- `'use client'` on the page: no. The page stayed a Server Component from the 2.0b preview; only the logout button is a client component.
- Prompt or approach: the page and button were written while 2.2 was in review and committed after it. A 2.2 review note was applied here: logout originally swallowed failures and navigated anyway, but a failed logout leaves the httpOnly cookie set, so `/signin` would bounce the user back to `/app`; on failure the button now stays and shows "Couldn't log out. Try again."
- Verified by: Chrome DevTools MCP against a production build with its own API: anonymous `/app` redirects to `/signin` (307) and the response is `private, no-store`; after an in-page signup, `/app` shows "Welcome to the application." and the user's name, email, id and member-since date; the logout button is reached with Tab and shows a focus ring; during a slowed request it is disabled with "Logging out…"; logout lands on `/signin` and reloading `/app` redirects there; with the API stopped, logout stays on `/app` with the error message and the button re-enabled; no console messages on the happy path. `pnpm lint`, `pnpm typecheck`, web build. No reviewer (L).
- Corrected or reworked: the logout-failure handling above.
- Differed from AI suggestion: none.


### 2.4 `/signup` page
- Date / time spent: 2026-11-04, about 40 min (estimate 25)
- AI-generated: `components/signup-form.tsx` rebuilt on React Hook Form with the 2.1 schema (`@hookform/resolvers` 7.0.2, `react-hook-form` 7.91); `form-field.tsx` and `password-field.tsx` take refs (React 19 ref as a prop); `/signup` checks the session and redirects signed-in users to `/app`; `auth-shell.tsx` shows the preview banner only when asked (still on `/signin` until 2.5).
- Accessibility gaps in the AI's first form draft and the fixes:
  - It used `mode: 'onBlur'` with `reValidateMode: 'onChange'`; React Hook Form only applies `reValidateMode` after the first submit, so a corrected field kept its error. Caught in the browser; now `onTouched` (validate on first blur, then on every change), which is §8's rule.
  - From review: the alert sat inside an extra `aria-live` wrapper (double announcement, plus an empty gap above the form); removed. Field errors used `role="alert"`, which interrupts typing on every change; now `aria-live="polite"`. The password toggle combined `aria-pressed` with a changing label ("Hide password, pressed"); now a fixed "Show password" label with `aria-pressed`.
  - Not changed, recorded: the tab order is email → name → password → Show password → submit. The roadmap lists email → name → password → submit, but taking the toggle out of the tab order would make it unreachable by keyboard (WCAG 2.1.1).
- Prompt or approach: per the roadmap; the field, alert and button components came from the 2.0b preview.
- Verified by: Chrome DevTools MCP (Playwright MCP is not configured) against a production build with its own API: every input has a visible label; an invalid email shows "Enter a valid email address" on blur, announced and linked to the input, and clears once corrected; submitting with an empty name and password focuses the name field; a duplicate email shows "An account with this email already exists" on the email field and focuses it; the submit is disabled with "Creating account…" while pending; three quick clicks send one request; a valid signup lands on `/app`; a signed-in visit to `/signup` goes to `/app`; no horizontal scroll at a 320 px emulated viewport; no console messages on a clean load. `pnpm --filter web test`, `pnpm lint`, `pnpm typecheck`. Reviewer: `code-reviewer`, verdict FLAG; fixed above and below.
- Corrected or reworked (from review): `isSubmitting` ends when the handler returns, before `/app` loads, so the button re-enabled during navigation and a second click could post again (409); a navigating state now keeps it disabled. The same fixes went into the 2.5 signin form, written during the review.
- Differed from AI suggestion: none.


### 2.5 `/signin` page
- Date / time spent: 2026-11-04, about 20 min (estimate 15)
- AI-generated: `components/signin-form.tsx` on React Hook Form with the 2.1 schema; `/signin` checks the session and redirects signed-in users to `/app`; the design preview banner (`preview-banner.tsx`) and its shell prop removed now that every screen is connected; `docs/design/README.md` updated.
- Reuse vs duplication on the shared components: the form reuses `FormField`, `PasswordField`, `FormAlert` and `SubmitButton` unchanged from 2.4 (the "props only" rule held). The submit handler (server field errors onto fields with focus on the first, alert and reference for the rest, a navigating flag against double submit) is repeated in the two forms rather than extracted: two short copies with different field lists read more plainly than a generic hook, and a third form would be the point to extract it.
- Prompt or approach: the form was written while 2.4 was in review, so the 2.4 review fixes (no extra live-region wrapper, navigating flag, polite field errors) were applied to it before it shipped.
- Verified by: Chrome DevTools MCP against a production build with its own API: a wrong password and an unknown email both show the identical alert "Invalid email or password"; past the limit the alert reads "Too many attempts. Try again in 60 seconds." (from `Retry-After`); an empty submit focuses the email field with both required messages; a padded uppercase email signs in and lands on `/app`; a signed-in visit to `/signin` goes to `/app`; logout returns to `/signin` (the M2 loop: sign up, `/app`, log out, sign in); tab order email → password → Show password → submit; no horizontal scroll at 320 px; no console messages. `pnpm test` (web 114, API 289), `pnpm lint`, `pnpm typecheck`, web build. No reviewer (L).
- Corrected or reworked: none beyond the 2.4 fixes applied before commit.
- Differed from AI suggestion: none.


### 0.1 AI workflow (completed 2026-11-04)
- Date / time spent: 2026-11-04, about 10 min
- AI-generated: `.claude/agents/researcher.md` (read-only; context7 and official sources; version-specific facts with sources, "unconfirmed" where unsure), `.claude/agents/governance-reviewer.md` (read-only; checks the CLAUDE.md non-negotiables, scope, the spec and correctness; verdict PASS, FLAG or BLOCK), `.mcp.json` (context7 `@upstash/context7-mcp@4.5.0`, playwright `@playwright/mcp@0.0.84`, github through the official remote server with the token read from `GITHUB_PERSONAL_ACCESS_TOKEN`, so no secret is committed), and the `## Non-negotiables` heading in `CLAUDE.md`.
- Why now: the bootstrap check found row 0.1 marked ✅ without these files, so tasks 0.2 to 2.5 ran with stand-ins (a general-purpose subagent for research, `code-reviewer` for review, Chrome DevTools MCP for browser checks), as each entry records. From 3.1 on the real agents and MCP servers are available once the session restarts.
- Verified by: `.mcp.json` parses; package names and versions checked on npm; the GitHub remote URL taken from the official server's README. The agents' `mcp__context7` tool entry is unconfirmed until the next session loads it.
- Corrected or reworked: the "Before 2026-11-03 … owner review" 0.1 entry above described files that did not exist; this entry supersedes it.
- Differed from AI suggestion: none.


### Follow-up: open items after M2
- Date / time spent: 2026-11-04, about 15 min
- What changed:
  - Docs, from the 0.4 finding: §6's sequence diagram said the rewrite "(forwards client IP)", which is wrong; it now says the rewrite passes `X-Forwarded-For` through and adds none. §10 and the §7 production row now state that per-client rate limiting needs an edge proxy that appends `X-Forwarded-For`; a future-improvements row covers deploying without one.
  - Local Mongo moved to host port 27018 (`docker-compose.yml`, §7 examples, `apps/api/.env.example`, and the owner's local `apps/api/.env`), because another project's `mongo` container also binds 27017 and whichever started first silently took the port. The container still listens on 27017 inside; the data volume is unchanged.
  - The stray `AI.md` header edit (the `<!-- AI.md -->` line removed and `# AI Usage` without its `#`) was discarded; no entries were affected.
- Verified by: `pnpm test` (API 289, web 114) against Mongo on 27018 using the local `.env`; the API booted from `.env` and answered; `pnpm lint`; `prettier --check`.
- Differed from AI suggestion: the AI first recommended stopping the other container (0.3); after the conflict recurred, the owner asked to resolve it and the port was moved instead.


### 0.6 CI skeleton
- Date / time spent: 2026-11-04, about 25 min (estimate 15)
- AI-generated: `.github/workflows/ci.yml`: on every push and pull request, a `mongo:8` service container with a `mongosh` ping health check, pnpm from `packageManager`, Node from `.nvmrc` with the pnpm store cached, `pnpm install --frozen-lockfile`, lint, typecheck, build, and both Vitest suites. Only non-secret values (owner-approved at the env gate): `API_URL` for the web build and `TEST_MONGODB_URI` for the service container; Vitest pins `NODE_ENV=test` and a test-only `JWT_SECRET` itself; no GitHub secrets.
- CI config corrections (service container, cache key): the first two runs failed at "Initialize containers". MongoDB 8 refuses to start on Linux kernels 6.19 to 7.0.13 (its TCMalloc per-CPU caches crash with the kernel's rseq change, SERVER-121912), and `ubuntu-latest` (now 26.04) and `ubuntu-24.04` runners both have such kernels. The AI first pinned `ubuntu-24.04`, which did not help. Reading MongoDB's startup check showed it only fires when TCMalloc per-CPU caches are active, and the image sets `GLIBC_TUNABLES=glibc.pthread.rseq=0` to enable them; the service now sets `rseq=1`, so glibc keeps rseq and the caches stay off. The cache key needed no change (setup-node keys it on the lockfile).
- Prompt or approach: the steps were run locally from a clean environment before the first push, so the remaining failures were the platform issue only. The AI.md entry and roadmap tick land in this follow-up commit because the validation needs the green run's link, which exists only after pushing.
- Verified by: green run https://github.com/jrmoha/full-stack-auth-module/actions/runs/41838353764 (lint, typecheck, build; web 114 and API 289 tests against the service container; pnpm store cache saved). No reviewer (L).
- Differed from AI suggestion: none.


### 3.1 Swagger at `/docs`
- Date / time spent: 2026-11-04, about 30 min (estimate 15)
- AI-generated: `apps/api/src/common/docs/` (`mountApiDocs`: OpenAPI document with the `access_token` cookie auth scheme, UI at `/docs`, JSON at `/docs/json`; `ErrorResponseDto` for the §4 error shape), `auth/dto/user-response.dto.ts`, `@ApiProperty` on both DTOs, operation and response decorators on the four routes, the production-gated mount in `configureApp`, and `test/docs.spec.ts` (10 tests); `@nestjs/swagger` 12.1.0; `allowBuilds: '@scarf/scarf': false` (install-time telemetry from swagger-ui-dist).
- How the AI handled the Helmet and Swagger UI CSP clash: it tested before relaxing anything. The spec and the ADR assumed Swagger UI needs inline assets the default CSP blocks; Swagger UI 5 via `@nestjs/swagger` 12 loads its scripts from files, and in Chrome `/docs` rendered all four operations with the Authorize button and zero console messages under Helmet's default CSP. So no relaxation was added, a test pins `/docs` to the same CSP as the JSON endpoints, and §10, the swagger ADR and the roadmap note were corrected.
- Prompt or approach: `researcher` was not loaded yet in this session (added at the end of 0.1 follow-up), so the installed package's types and Swagger UI template were read directly.
- Verified by: `/docs` 200 and `/docs/json` listing all four paths with success, §4 error and cookie-auth details; both, plus `/docs-json`, `/docs-yaml` and the UI script, 404 with `NODE_ENV=production`; Chrome DevTools MCP render check with no console messages; `pnpm test` (API 299, web 114), lint, typecheck, build. Reviewer: `code-reviewer` (the `governance-reviewer` definition exists but loads next session), verdict FLAG; fixed below.
- Corrected or reworked (from review): Swagger also served a YAML copy at `/docs-yaml` in development; now JSON only. A class-level 503 response documented a 503 on logout, which never touches the database; 503 is now on signup, signin and `/auth/me` only, and logout documents exactly 204 and 500. The docs tests now check required fields and length limits on the signup schema. The rate-limit description no longer hardcodes the numbers.
- Not changed: the `@ApiProperty` length limits repeat the §4 numbers already in the validators; worth sharing constants if §4 changes.
- Differed from AI suggestion: none.


### 3.2 E2E suite and CI job
- Date / time spent: 2026-11-04, about 40 min (estimate 40)
- AI-generated: `apps/web/playwright.config.ts` (Chromium; the API from its build on :4200 and `next start` on :3200 from a separate `.next-e2e` build, so `pnpm dev` and the regular build are untouched; the API gets the test URI and pinned values), `apps/web/e2e/test-db.ts` (the `_test` guard, mirrored from the API suite), `e2e/global-setup.ts` (deletes `users`, never drops), `e2e/auth.spec.ts` (7 tests: the §9 flows plus cookie flags and no token in script or storage), `distDir` from `NEXT_DIST_DIR`, the root `pnpm e2e` script, and an `e2e` CI job after `verify`; `@playwright/test` 1.64.1 and `mongodb` ~7.7 (Mongoose's driver line).
- Researcher findings on Playwright web server setup for two apps (read from the installed package; the `researcher` agent loads next session): `webServer` takes an array and waits on each URL, and a 401 counts as ready, so the API waits on `/auth/me`; the config loads before any server starts, so the database guard lives in the config, not only in global setup, because the API's index build would otherwise touch a wrong database before a later check aborted; Playwright loads the config and setup files as CommonJS here, so `import.meta` failed on the first run and `__dirname` is used.
- Flakiness fixes: none needed. Each test signs up its own account (time plus counter), one worker, one retry in CI, fixed ports never reused; 7/7 green on three consecutive local runs and in CI.
- Verified by: `pnpm e2e` green locally (7/7, about 4 s after builds); `TEST_MONGODB_URI` pointed at `auth_dev` aborts with the guard message before any server starts; green CI run with both jobs: https://github.com/jrmoha/full-stack-auth-module/actions/runs/41840807663; `pnpm lint`, `pnpm typecheck`. Reviewer: `code-reviewer`, verdict FLAG; fixed below.
- Corrected or reworked (from review): after a local e2e run `pnpm lint` crashed on `.next-e2e` build output; it is now ignored by ESLint and excluded from the web tsconfig. The developer's `apps/api/.env` (also read by the API) could change `TRUST_PROXY_HOPS`, `LOG_LEVEL`, `JWT_TTL_SECONDS` and the throttle window in e2e; all are pinned. The web server runs with `NODE_ENV=production`. §7 and §9 now name the e2e ports, the `.next-e2e` build and `NEXT_DIST_DIR`. The cookie test also checks localStorage and sessionStorage for a token.
- Process slip: the commit `f0b3c0d` went out without this entry. The command that appended it was chained after a Prettier check, which failed on the then-untracked README, so the append was skipped; the entry lands in this follow-up instead of rewriting a pushed commit.
- Differed from AI suggestion: none.


### 4.1 README
- Date / time spent: 2026-11-04, about 10 min (estimate 15)
- AI-generated: `README.md`: prerequisites (Node 24, pnpm 10.33 via corepack, Docker), setup (clone, install, both env files, generating `JWT_SECRET`), `pnpm dev` with the three URLs, tests (`pnpm test` with Mongo up, Playwright install, `pnpm e2e`), the scripts table, the four endpoints in brief, the layout, and links to the architecture, ADRs, roadmap, AI.md and future improvements (detail linked, not copied).
- What the draft overstated or got wrong: nothing found at commit time. Every command had already been run in this session, and every relative link and section anchor was checked; 4.3 re-runs the commands from a fresh clone and fixes anything they expose here.
- Verified by: link and anchor check, `prettier --check`. No reviewer (L).
- Differed from AI suggestion: none.


### 4.2 AI.md summary and future improvements
- Date / time spent: 2026-11-04, about 15 min (estimate 15)
- AI-generated: the four summary sections and the time comparison at the top of this file, and the final additions to `docs/future-improvements.md` (limitations found while building: the edge-proxy dependency for client IP, the proxy's plain-text 500, the CI MongoDB kernel workaround, Swagger repeating the §4 limits, the fixed "N seconds" wording; two new revisit rows).
- How the summary was assembled: from the per-task entries only, which were not rewritten. Roadmap rows were cross-checked against entry headings (every row has an entry; 4.3 follows), and the time totals were computed from each entry's "about N min (estimate M)" line rather than recalled.
- What the draft summary overclaimed: nothing found on re-reading it against the entries. The point most at risk was the time figure: it is given with and without the avoidable 56-minute reinstall (0.5), not only the flattering one, and section 4 names the three places the owner's decision differed (2.0b, the Mongo port, 4.3) rather than saying every recommendation was accepted. An earlier version of this entry claimed the draft had overclaimed on those points; that was not true and was corrected before pushing.
- Verified by: the row-versus-entry cross-check; every summary bullet cites task IDs that exist below. No reviewer (L).
- Differed from AI suggestion: none.


### 4.3 Clean-clone check and release
- Date / time spent: 2026-11-04, about 15 min (estimate 10)
- What was done: a fresh clone into an empty temporary directory, then the README exactly as written. `pnpm install` (frozen lockfile, argon2's build allowed), both env files copied from their examples with a newly generated `JWT_SECRET`, `docker compose up -d --wait mongo`, `pnpm test` (API 299, web 114), `pnpm --filter web exec playwright install chromium`, `pnpm e2e` (7/7), and `pnpm dev`: `/` redirected to `/signin`, `/signin` 200, `/auth/me` 401, `/docs` 200, and a signup through the web origin 201. History scan over all refs: no `.env` file other than the examples ever committed; neither the owner's dev `JWT_SECRET` nor the clone's appears anywhere in history; no token-like strings or private keys; the only URI with credentials is the fake `zq9user:zq9pass` sentinel in the 1.1 scrubbing test. Pushed to the private repo with CI green.
- Anything the clean clone exposed: nothing in the README or the code needed a fix. Worth knowing: the compose file pins its project name, so a clone on a machine that already has this project's container reuses that container and its data volume.
- Release: the owner made the repository public with `gh repo edit --visibility public` (the step they kept at the gate); confirmed public at https://github.com/jrmoha/full-stack-auth-module, reachable without signing in.
- Verified by: the commands above. No reviewer (L).
- Differed from AI suggestion: the AI offered to make the repo public automatically once every check passed; the owner kept that step.
