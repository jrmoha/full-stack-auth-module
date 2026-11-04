<!-- docs/decisions/2026-11-03-swagger-exposure.md -->
# Decision: Swagger at /docs outside production only

**Date:** 2026-11-03
**Status:** Accepted

## Context
API documentation is a scored bonus item. Live docs widen the production attack surface. The spec first assumed Swagger UI needs inline assets that the default Helmet CSP blocks; in 3.1, Swagger UI 5 (`@nestjs/swagger` 12) loaded its scripts from files and rendered with no CSP errors under the default policy.

## Decision
Mount Swagger UI at `/docs` on the API origin only when `NODE_ENV` is not production. Every route, `/docs` included, keeps the default Helmet CSP (no relaxation needed; amended 2026-11-04). Only the JSON document is served, at `/docs/json`. Document all four endpoints, request bodies, the error shape and the cookie auth scheme.

## Alternatives Considered
### Option A - Swagger always on
**Rejected because:** it exposes the API surface in production and forces a looser CSP there.

### Option B - Committed static OpenAPI file only
**Rejected because:** without a generation step it goes stale as soon as a DTO changes.

## Consequences
- Production consumers get no live docs; exporting the spec as a CI artifact is the follow-up.
- 12-18 months: a public API would need versioned, published docs instead.
- Could go wrong: `NODE_ENV` unset in production exposes docs (prevented: `NODE_ENV` is required by the env schema); a future Swagger UI that needs inline scripts would break the page under the default CSP (a test pins the default CSP on `/docs`; relax it for `/docs` only if that happens).

**Reversibility:** Easy. One setup branch.