<!-- docs/future-improvements.md -->
# Future Improvements

## Known limitations
- No token revocation: logout removes the cookie, but a copied token stays valid until it expires (up to 1 hour).
- No refresh token: users are signed out after an hour without warning.
- Signup returns 409 for a registered email, which reveals account existence; mitigated only by rate limiting.
- Rate limits are per API instance (in-memory store).
- No data retention or account deletion policy; user records are kept indefinitely.
- The web app sends basic security headers but no nonce-based Content Security Policy.
- Not deployed: no Dockerfiles, no hosting configuration; production behavior is a documented stance only.
- E2E runs in Chromium only.
- Per-client rate limiting relies on an edge proxy that appends `X-Forwarded-For`; the Next.js rewrite adds none (0.4).
- When the API is down, `/api/*` returns the proxy's plain-text 500 rather than the §4 error shape; the web shows the generic error.
- CI runs `mongo:8` with TCMalloc per-CPU caches off (`GLIBC_TUNABLES=glibc.pthread.rseq=1`) because MongoDB 8 refuses to start on the runners' Linux 6.19+ kernels (SERVER-121912); the same would apply to a local Docker host on such a kernel.
- The §4 length limits also appear in the Swagger `@ApiProperty` decorators (3.1), a fifth place to update on a validation change.
- The 429 message reads "Try again in 1 seconds" for a one-second wait, because §8 fixes the text as "N seconds".

## Deferred decisions (when to revisit)
| Decision | Revisit when |
|---|---|
| Refresh tokens and revocation (server sessions or a denylist) | Sessions must outlive 1 hour, or a "log out everywhere" feature is needed |
| Shared rate-limit store (Redis) | A second API instance is deployed |
| Client IP without relying on an edge proxy (the Next.js rewrite adds no `X-Forwarded-For`) | The app is deployed without a reverse proxy that appends `X-Forwarded-For`, or Next.js gains a way to forward the socket address |
| Email verification | Signup must stop revealing registered emails, or email ownership matters |
| Password reset | Real users need account recovery (out of scope per the brief) |
| Account lockout or progressive delays per account | Credential-stuffing traffic appears that per-IP limits miss |
| Nonce-based CSP for the web app | Any third-party script or user-generated content is added |
| Dockerfiles and a deploy target | The app needs a hosted environment |
| Exported OpenAPI spec as a CI artifact | An external consumer needs API docs in production |
| Per-worker test databases | Test suite time becomes a bottleneck |
| Unicode-aware email normalization | Internationalized email addresses must be supported |
| Drop the CI `GLIBC_TUNABLES` override | A `mongo:8` release supports Linux 6.19+ with per-CPU caches (SERVER-121912) |
| Share the §4 length constants with the Swagger decorators | The next validation change, or a third consumer of the limits |
| Arabic/RTL language toggle (designed in `docs/design/`) | A second language is required; needs localised §4 and §8 messages on both web and API |
| Post-sign-in confirmation toast (designed in `docs/design/`) | Product wants sign-in feedback beyond landing on `/app`; needs a one-shot flag across the server redirect |

## Next steps
1. Dockerfiles for both apps and a compose profile that runs the full stack.
2. Refresh-token rotation with reuse detection, plus revocation on logout.
3. Email verification on signup; password reset flow.
4. Nonce-based CSP for the web app.
5. Redis-backed throttler storage for horizontal scaling.