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