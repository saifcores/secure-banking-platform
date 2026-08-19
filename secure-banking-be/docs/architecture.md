# Architecture

Documentation index: [README.md](README.md).

## Positioning

This is a secure multi-tenant banking platform demonstrating OAuth2/OIDC, IAM, financial transaction processing, idempotency, ledger, event-driven architecture and service-to-service security.

The **backend** (`secure-banking-be`) is implemented. The **frontend** (`secure-banking-fe`) is a Vite + React scaffold intended as the `banking-frontend` PKCE client; it is not wired to Keycloak or the gateway yet. Until then, use curl / Swagger as in [demos.md](demos.md).

## Directing principle

```
Identity → Authorization → Tenant Isolation → Business Rules
        → Transaction → Ledger → Event → Audit → Observability
```

Every write path on a financial resource walks this chain. Skipping a step is a design defect.

## Runtime view

```
                         ┌───────────────┐
                         │   Frontend    │
                         └───────┬───────┘
                                 │ Authorization Code + PKCE
                                 ▼
                         ┌───────────────┐
                         │   Keycloak    │
                         │ Realm banking │
                         └───────┬───────┘
                                 │ Bearer JWT
                                 ▼
                         ┌───────────────┐
                         │ API Gateway   │
                         │ JWT, rate     │
                         │ limit, CID    │
                         └───────┬───────┘
               ┌─────────────────┼─────────────────┐
               ▼                 ▼                 ▼
        Customer Service   Account Service   Transaction Service
               │                 │                 │
               │                 │                 ├─ Outbox ─► Kafka
               │                 │                 │              │
               │                 │                 │              ▼
               │                 │                 │        Audit Service
               └─────────────────┴─────────────────┘
                                 │
                                 ▼
                           PostgreSQL
                     (customer_db / account_db /
                      transaction_db / audit_db)
```

## Service boundaries

| Service     | Owns                                                      | Does not own       |
| ----------- | --------------------------------------------------------- | ------------------ |
| Customer    | profiles, user↔customer link                              | balances           |
| Account     | accounts, balances, status, atomic money movement         | transfer lifecycle |
| Transaction | orchestration, state machine, ledger, idempotency, outbox | raw balances       |
| Audit       | immutable trail                                           | business decisions |
| Gateway     | edge concerns                                             | domain rules       |

## Financial write path

1. Gateway authenticates JWT and forwards `Authorization` + `X-Correlation-Id`.
2. Transaction service maps roles → permissions, binds `tenant_id`.
3. Idempotency key is reserved (`tenant_id + key` unique).
4. Account snapshots are loaded over OAuth2 client credentials.
5. Transfer rules run (existence, status, tenant, balance, currency).
6. State machine: `CREATED → PROCESSING`.
7. Account service posts debit+credit in **one local DB transaction** (idempotent).
8. Transaction service writes balanced ledger entries + outbox row in **one local DB transaction**.
9. State machine: `PROCESSING → COMPLETED`.
10. Outbox publisher emits to Kafka; audit service consumes.

Retries after step 7 cannot double-spend: both services key money movement on `Idempotency-Key`.

## Database strategy

Database-per-service on a shared PostgreSQL instance (separate databases). All tenant-aware tables have `tenant_id`. Hibernate filters enforce isolation on list queries; get-by-id bypasses the filter then applies `TenantGuard` so cross-tenant access returns `403 TENANT_ACCESS_DENIED`.

## Shared libraries

See [modules.md](modules.md). `common-domain` holds rules and the RBAC matrix with no Spring. `common-security` binds JWT, tenant, and Hibernate. `common-web` standardises errors, correlation ids, and HTTP metrics.
