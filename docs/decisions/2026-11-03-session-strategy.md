<!-- docs/decisions/2026-11-03-session-strategy.md -->
# Decision: Stateless 1-hour JWT in an httpOnly cookie, no refresh token

**Date:** 2026-11-03
**Status:** Accepted

## Context
The owner locked `@nestjs/jwt` with Passport and an httpOnly cookie. The brief needs a session that lets the user reach a protected page and log out; it says nothing about long sessions, revocation or multiple devices.

## Decision
Issue an HS256 JWT with claims `sub`, `iat`, `exp` only, lifetime `JWT_TTL_SECONDS` (default 3600). Store it in the `access_token` cookie: HttpOnly, SameSite=Lax, Path=/, Max-Age equal to the lifetime, Secure in production. Verify with the algorithm pinned to HS256 and 30 s clock tolerance. No refresh token.

## Alternatives Considered
### Option A - Server-side sessions in Mongo
**Rejected because:** it adds a collection, expiry cleanup and a database read per request to gain revocation the brief does not require.

### Option B - JWT with rotating refresh tokens
**Rejected because:** rotation, reuse detection and storage double the auth surface with no requirement behind it.

### Option C - Token in browser storage sent as a bearer header
**Rejected because:** any XSS could read it, and the locked context forbids frontend access to the token.

## Consequences
- No revocation: a stolen token stays valid until expiry; logout only removes the cookie.
- Users are signed out after an hour without warning.
- 12-18 months: adding refresh tokens or server sessions changes the strategy, guard and cookie helper only; no stored data changes.
- Could go wrong: `JWT_SECRET` leak lets anyone mint sessions (mitigated by no default, 32-character minimum, gitignored env); claims grow to include PII (blocked by the reviewer).

**Reversibility:** Easy. No persisted data depends on the token format.