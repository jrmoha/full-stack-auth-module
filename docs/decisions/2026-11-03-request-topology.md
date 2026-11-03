<!-- docs/decisions/2026-11-03-request-topology.md -->
# Decision: First-party cookie through a Next.js rewrite, server-side session checks

**Date:** 2026-11-03
**Status:** Accepted

## Context
The web app and API run on different origins (:3000 and :4000 locally). The cookie must reach the API on browser calls and be readable by Next.js Server Components to protect `/app` without exposing the token to JavaScript.

## Decision
The browser talks only to the web origin. Next.js rewrites `/api/*` to `API_URL`, so `Set-Cookie` lands on the web origin as a first-party cookie. Pages check the session in their Server Component by calling `API_URL/auth/me` server-to-server, forwarding only the `access_token` cookie and the client's forwarded-for header, with caching disabled. `/`, `/signin`, `/signup` and `/app` all use this check. No middleware or proxy file.

## Alternatives Considered
### Option A - Browser calls the API cross-origin
**Rejected because:** the cookie becomes third-party, needing SameSite=None, credentialed CORS on every call, and exposure to third-party cookie blocking.

### Option B - Next.js route handlers as a BFF per endpoint
**Rejected because:** every endpoint is re-implemented in the web app, duplicating the contract.

### Option C - Interception file checking cookie presence
**Rejected because:** an expired cookie is present but invalid, so `/signin` sends to `/app` and `/app` sends back, looping forever.

### Option D - Verify the JWT inside the web app
**Rejected because:** the signing secret would live in two apps and verification logic would be duplicated.

## Consequences
- One extra server-to-server request per protected render; negligible at this scale.
- An API outage renders the error page on public routes too, because they also check the session.
- 12-18 months: a separate API domain in production would need the same rewrite at the edge or a cookie-domain change.
- Could go wrong: the rewrite drops `Set-Cookie` or the client IP (verified in task 0.4); the session fetch gets cached (no-store enforced and reviewed).

**Reversibility:** Easy. Routing and one helper change; no data impact.