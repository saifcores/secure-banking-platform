# Security model

## Chain

1. **Identity** — Keycloak issues JWT.
2. **Authentication** — Gateway + each service validate signature/issuer via JWKS.
3. **RBAC** — realm roles become `ROLE_*`.
4. **Permissions** — roles map to `account:read`, `transaction:create`, …
5. **Tenant isolation** — `tenant_id` claim + Hibernate filter + `TenantGuard`.
6. **Horizontal access** — CUSTOMER may only act on own customer/accounts.
7. **Input validation** — Bean Validation on payloads.
8. **S2S** — client credentials, never a user password.
9. **Audit** — sensitive outcomes land in `audit_events` via Kafka.

## Permission matrix

| Function | CUSTOMER | OPERATOR | SUPPORT | AUDITOR | ADMIN |
| --- | ---: | ---: | ---: | ---: | ---: |
| Read own account | ✓ | ✓ | ✓ | — | ✓ |
| Create account | — | ✓ | — | — | ✓ |
| Create transaction | ✓ | ✓ | — | — | ✓ |
| Cancel transaction | — | ✓ | — | — | ✓ |
| Read customer | limited | ✓ | ✓ | — | ✓ |
| Read audit | — | — | — | ✓ | ✓ |
| Administration | — | — | — | — | ✓ |

Method security: `@PreAuthorize("hasAuthority('transaction:create')")`.

## Secrets

Not in git: Keycloak client secrets, DB passwords, JWT realm keys. Compose values are **demo-only**. Kubernetes uses `Secret` vs `ConfigMap`.

APIs never return tokens, passwords, or client secrets.
