# Glossary

| Term                                                      | Meaning in this repo                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Tenant                                                    | A bank: `BANK_DAKAR`, `BANK_ABIDJAN`, `BANK_BAMAKO`, or `PLATFORM`                                                  |
| `tenant_id`                                               | JWT claim and column on every tenant-aware row                                                                      |
| CUSTOMER / OPERATOR / SUPPORT / AUDITOR / ADMIN / SERVICE | Keycloak realm roles; mapped to permissions in `Role`                                                               |
| Directing principle                                       | Identity → Authorization → Tenant Isolation → Business Rules → Transaction → Ledger → Event → Audit → Observability |
| Idempotency-Key                                           | Client header; unique per `(tenant_id, key)` with a SHA-256 payload hash                                            |
| Outbox                                                    | `outbox_events` rows written in the same DB transaction as the ledger, then published to Kafka                      |
| Ledger                                                    | Double-entry `ledger_entries` (DEBIT + CREDIT) that must balance                                                    |
| S2S                                                       | Service-to-service: `transaction-service` client-credentials token calling account internal APIs                    |
| `TenantGuard`                                             | After loading by id without the Hibernate filter, deny if resource tenant ≠ current tenant                          |
| `ApiError`                                                | Standard JSON error: `status`, `code`, `message`, `traceId`, `path`                                                 |
| Database-per-service                                      | Separate Postgres databases on one instance: `customer_db`, `account_db`, `transaction_db`, `audit_db`              |
