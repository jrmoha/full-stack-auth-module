<!-- docs/decisions/2026-11-03-email-uniqueness.md -->
# Decision: Unique index on normalized email, duplicates detected on insert

**Date:** 2026-11-03
**Status:** Accepted

## Context
Two signups with the same email can arrive concurrently. A read-then-write check cannot prevent both from succeeding. There is no migration tooling in scope.

## Decision
Normalize email (trim, lowercase) before storage. Declare a unique index on `email` in the Mongoose schema. The users module awaits model initialization at boot, so the API does not serve before the index exists. Signup inserts directly; Mongo duplicate-key error 11000 becomes a typed duplicate error in the users module and 409 `EMAIL_TAKEN` in the auth service. Tests clear data with deletes, never drops.

## Alternatives Considered
### Option A - Pre-check with a find before insert
**Rejected because:** two concurrent requests both pass the check and both insert.

### Option B - Case-insensitive collation index
**Rejected because:** normalization already lowercases; a collation adds a second mechanism that must stay consistent with it.

### Option C - Standalone index creation script
**Rejected because:** it adds a deploy step to remember with no migration framework to run it.

## Consequences
- Boot fails loudly if existing data violates the index.
- 12-18 months: changing normalization (for example Unicode case folding) requires deduplicating existing users before the index can rebuild.
- Could go wrong: requests served before the index builds (prevented by awaiting init); a test dropping the database and losing the index (forbidden in CLAUDE.md).

**Reversibility:** Hard. The index constrains stored data; loosening or redefining it needs a data cleanup.