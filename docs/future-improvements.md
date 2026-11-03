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

## Deferred decisions (when to revisit)
| Decision | Revisit when |
|---|---|
| Refresh tokens and revocation (server sessions or a denylist) | Sessions must outlive 1 hour, or a "log out everywhere" feature is needed |
| Shared rate-limit store (Redis) | A second API instance is deployed |
| Email verification | Signup must stop revealing registered emails, or email ownership matters |
| Password reset | Real users need account recovery (out of scope per the brief) |
| Account lockout or progressive delays per account | Credential-stuffing traffic appears that per-IP limits miss |
| Nonce-based CSP for the web app | Any third-party script or user-generated content is added |
| Dockerfiles and a deploy target | The app needs a hosted environment |
| Exported OpenAPI spec as a CI artifact | An external consumer needs API docs in production |
| Per-worker test databases | Test suite time becomes a bottleneck |
| Unicode-aware email normalization | Internationalized email addresses must be supported |

## Next steps
1. Dockerfiles for both apps and a compose profile that runs the full stack.
2. Refresh-token rotation with reuse detection, plus revocation on logout.
3. Email verification on signup; password reset flow.
4. Nonce-based CSP for the web app.
5. Redis-backed throttler storage for horizontal scaling.