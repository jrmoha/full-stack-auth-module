<!-- docs/decisions/2026-11-03-swagger-exposure.md -->
# Decision: Swagger at /docs outside production only

**Date:** 2026-11-03
**Status:** Accepted

## Context
API documentation is a scored bonus item. Swagger UI needs inline assets that the default Helmet CSP blocks, and live docs widen the production attack surface.

## Decision
Mount Swagger UI at `/docs` on the API origin only when `NODE_ENV` is not production. Apply a relaxed CSP to `/docs` routes only; JSON endpoints keep the default Helmet CSP. Document all four endpoints, request bodies, the error shape and the cookie auth scheme.

## Alternatives Considered
### Option A - Swagger always on
**Rejected because:** it exposes the API surface in production and forces a looser CSP there.

### Option B - Committed static OpenAPI file only
**Rejected because:** without a generation step it goes stale as soon as a DTO changes.

## Consequences
- Production consumers get no live docs; exporting the spec as a CI artifact is the follow-up.
- 12-18 months: a public API would need versioned, published docs instead.
- Could go wrong: `NODE_ENV` unset in production exposes docs (prevented: `NODE_ENV` is required by the env schema); the CSP relaxation leaking to other routes (covered by a test).

**Reversibility:** Easy. One setup branch.