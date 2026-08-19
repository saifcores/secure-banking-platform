# Testing

Run from `secure-banking-be`:

```bash
./mvnw test
```

Surefire 3.5.2. No Spring Boot tests against a live Keycloak in CI by default.

## What is covered

| Area                   | Tests                                   | What they prove                                                                          |
| ---------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| RBAC matrix            | `RolePermissionMatrixTest`              | Role → permission mapping matches the security model                                     |
| Transfer rules         | `TransferRulesTest`                     | Same-account, tenant, status, currency, amount, balance                                  |
| Ledger                 | `LedgerValidatorTest`                   | Balanced vs imbalanced postings                                                          |
| State machine          | `TransactionStateMachineTest`           | Legal / illegal `TransactionStatus` transitions                                          |
| JWT converter          | `BankingJwtAuthenticationConverterTest` | Realm roles → `ROLE_*` + permission authorities                                          |
| Account money          | `AccountBalanceTest`                    | Debit/credit and non-negative invariant                                                  |
| Tenant isolation       | `AccountTenantIsolationTest`            | Cross-tenant get-by-id is `TENANT_ACCESS_DENIED` (Testcontainers when Docker API ≥ 1.40) |
| Transfer orchestration | `TransferApplicationServiceTest`        | Idempotent transfer, rules, failure path                                                 |

## Testcontainers

`AccountTenantIsolationTest` uses PostgreSQL Testcontainers. If the local Docker Engine API is incompatible, the suite is skipped automatically. Cross-tenant denial is still asserted in unit tests. To force Testcontainers: Docker Engine API ≥ 1.40 and Testcontainers **1.21.3**.

## Gaps (intentional for a lab)

- No full end-to-end test through the gateway + Keycloak + Kafka.
- No contract tests between transaction-service and account-service.
- Cancel/reverse and outbox publisher have thinner automated coverage than the happy-path transfer.

Prefer adding tests next to domain rules in `common-domain` before spinning new Spring contexts.
