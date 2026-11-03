<!-- docs/decisions/2026-11-03-rate-limiting.md -->
# Decision: Rate-limit signup and signin per client IP, in memory

**Date:** 2026-11-03
**Status:** Accepted

## Context
Signup and signin are the brute-force and enumeration targets. All browser traffic reaches the API through the Next.js rewrite, and Next.js calls `/auth/me` server-to-server on every protected render, so the immediate peer address is the web server, not the user.

## Decision
Apply `@nestjs/throttler` to signup and signin only: `THROTTLE_AUTH_LIMIT` (10) requests per `THROTTLE_AUTH_TTL_SECONDS` (60) per client IP. The client IP comes from the forwarded-for header with exactly `TRUST_PROXY_HOPS` (1) trusted. In-memory store. Rejections return 429 `RATE_LIMITED` with `Retry-After`. `/auth/me` and logout are not limited.

## Alternatives Considered
### Option A - Global limit on all routes
**Rejected because:** server-side `/auth/me` calls all come from the Next.js IP, so every user would share one bucket.

### Option B - Redis-backed store
**Rejected because:** one API instance exists; Redis adds infrastructure for no current benefit.

### Option C - Per-email limiting
**Rejected because:** anyone could lock a victim out by failing signins against their email.

## Consequences
- 12-18 months: a second API instance makes limits per instance; moving to a shared store is a configuration change.
- Could go wrong: a wrong trust-hop count either lets clients spoof their IP or collapses everyone onto the proxy IP (covered by a two-IP test); limits too tight for e2e (configurable through env).

**Reversibility:** Easy. Configuration and decorators.