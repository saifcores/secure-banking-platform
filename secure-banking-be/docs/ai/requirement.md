# Secure Multi-Tenant Banking Platform — backend

Implemented in `secure-banking-be`. Product docs: [../README.md](../README.md).

Directing principle: Identity → Authorization → Tenant Isolation → Business Rules → Transaction → Ledger → Event → Audit → Observability.

## Scope (delivered)

- Multi-tenant APIs behind an API gateway (JWT, rate limit, correlation id).
- Keycloak realm `banking` with RBAC + `tenant_id` claim.
- Customer, account, transaction, audit services (database-per-service).
- Idempotent transfers, double-entry ledger, transactional outbox → Kafka → audit.
- S2S OAuth2 client credentials (transaction → account).
- Local Compose stack + starter Kubernetes manifests.

## Out of scope (lab)

- Production core banking, FX, interest, cards, statements.
- Browser SPA (scaffold only in `secure-banking-fe`).
- Full HA Kafka / Postgres operators on Kubernetes.
