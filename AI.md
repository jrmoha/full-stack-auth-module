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
