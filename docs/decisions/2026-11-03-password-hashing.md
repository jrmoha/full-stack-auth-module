<!-- docs/decisions/2026-11-03-password-hashing.md -->
# Decision: Hash passwords with argon2id

**Date:** 2026-11-03
**Status:** Accepted

## Context
The brief requires a production-ready auth module. Passwords allow up to 128 characters (architecture §4). The hash format is stored data and outlives the code.

## Decision
Hash with argon2id via the `argon2` package using library default parameters. Signin for an unknown email runs a dummy verify against a hash of a random secret, generated once per process with the same parameters, so response time does not reveal account existence.

## Alternatives Considered
### Option A - bcrypt
**Rejected because:** it silently truncates input past 72 bytes; with a 128-character limit (and multi-byte characters) two different passwords could share a hash unless a pre-hash step is added, which is extra code and review surface.

### Option B - Node `crypto.scrypt`
**Rejected because:** parameters, salt handling and the stored encoding are hand-rolled; more code to get right in a time-boxed build, and less familiar to reviewers.

## Consequences
- Native module: CI and contributors need a Node LTS version with prebuilt binaries.
- 12-18 months: library defaults may lag OWASP guidance. The stored hash encodes its parameters, so rehash-on-signin can upgrade users without a migration.
- Could go wrong: install failure on an unusual platform; cost parameters too low or too high under load; dummy verify skipped in a refactor, reopening timing enumeration (covered by a spy test).

**Reversibility:** Hard. Existing hashes stay in argon2 format; moving away requires rehash-on-signin for every active user.