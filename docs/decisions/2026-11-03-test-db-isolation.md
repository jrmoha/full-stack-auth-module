<!-- docs/decisions/2026-11-03-test-db-isolation.md -->
# Decision: Real Mongo 8 test database guarded by name

**Date:** 2026-11-03
**Status:** Accepted

## Context
Integration and e2e tests write users. Running them against the dev database destroys local data and hides isolation bugs. CI needs the same behavior.

## Decision
Tests read only `TEST_MONGODB_URI`. Each suite's global setup refuses to run unless the database name ends in `_test` and the URI differs from `MONGODB_URI`. Locally the docker-compose `mongo:8` container serves `auth_test`; in CI a `mongo:8` service container does. Data is cleared with deletes between tests (indexes survive); test files run serially. E2E starts the API with `MONGODB_URI` set to the test URI and clears `users` before the run.

## Alternatives Considered
### Option A - mongodb-memory-server
**Rejected because:** e2e still needs a real server, giving two database mechanisms, plus a binary download on CI cold starts.

### Option B - One database per test worker for parallel runs
**Rejected because:** the setup cost is not repaid by a suite this small.

## Consequences
- Developers must run the Mongo container to run tests.
- 12-18 months: as the suite grows, per-worker databases are the upgrade path for speed.
- Could go wrong: someone points the test URI at a non-test database (blocked by the guard); leftover data between e2e runs (cleared at start).

**Reversibility:** Easy. Test configuration only.