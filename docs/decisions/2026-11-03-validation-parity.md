<!-- docs/decisions/2026-11-03-validation-parity.md -->
# Decision: Mirrored validation schemas with shared test fixtures

**Date:** 2026-11-03
**Status:** Accepted

## Context
The brief requires front-end and back-end validation to match. The locked context forbids a `packages/` directory and cross-app imports, so rules cannot be shared as code. Zod and class-validator default email checks accept different edge cases.

## Decision
Keep two mirrored schemas: Zod in `apps/web/src/lib/` and class-validator DTOs in `apps/api/src/auth/`. Both implement the plain-words rules in architecture §4, including a custom email rule (no library default) and identical message text. A root `fixtures/validation-cases.json` lists input, field, expected validity and expected message for every rule and boundary; both test suites must pass every row. A rule change updates Zod, the DTO, §4 and the fixtures in one commit.

## Alternatives Considered
### Option A - Shared validation package
**Rejected because:** the locked context forbids `packages/` and imports between apps.

### Option B - Generate one schema from the other
**Rejected because:** code generation adds tooling and hidden behavior that outweighs a few rules in a time-boxed build.

### Option C - Library default email validators on each side
**Rejected because:** they disagree on edge cases, which is exactly the drift the brief forbids.

## Consequences
- Every rule change touches four places; the fixture file turns drift into a failing test.
- 12-18 months: a new client (for example mobile) gets a third mirror and must run the same fixtures.
- Could go wrong: a rule added without a fixture row; tests asserting loosely (contains vs equals) and missing message drift. The reviewer checks both.

**Reversibility:** Easy. Test data and two small modules.