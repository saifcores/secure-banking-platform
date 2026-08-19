# Backend documentation

Index for `secure-banking-be`. Start with [architecture.md](architecture.md) if you are new to the platform.

## How to read this set

1. **Shape of the system** — architecture, C4, modules.
2. **How money moves** — sequence diagrams, data model, idempotence, ledger rules.
3. **How it is secured** — OAuth2, RBAC, multi-tenancy.
4. **How to run it** — local development, configuration, demos, tests.
5. **How it is operated** — observability, resilience, deployment.

## Catalog

### Design

| Document                                     | Contents                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)           | Positioning, directing principle, runtime view, service boundaries, financial write path |
| [glossary.md](glossary.md)                   | Terms used across the docs                                                               |
| [c4.md](c4.md)                               | C4 context, containers, transaction-service components                                   |
| [sequence-diagrams.md](sequence-diagrams.md) | Login, transfer, cross-tenant denial, idempotent replay                                  |
| [modules.md](modules.md)                     | Maven modules, shared libraries, package layout                                          |
| [data-model.md](data-model.md)               | Databases, tables, invariants                                                            |

### Domain & API

| Document                             | Contents                                                      |
| ------------------------------------ | ------------------------------------------------------------- |
| [api.md](api.md)                     | Public and internal HTTP APIs, headers, payloads, permissions |
| [errors.md](errors.md)               | `ErrorCode` catalog and HTTP mapping                          |
| [idempotence.md](idempotence.md)     | `Idempotency-Key`, two-layer reservation, conflict behaviour  |
| [multi-tenancy.md](multi-tenancy.md) | Tenants, Hibernate filter, `TenantGuard`, admin override      |

### Security

| Document                               | Contents                                      |
| -------------------------------------- | --------------------------------------------- |
| [oauth2-flows.md](oauth2-flows.md)     | Clients, PKCE, client credentials, JWT claims |
| [security-model.md](security-model.md) | Auth chain, permission matrix, secrets policy |

### Run & operate

| Document                                     | Contents                                        |
| -------------------------------------------- | ----------------------------------------------- |
| [local-development.md](local-development.md) | Prerequisites, Compose, IDE profiles, seed data |
| [configuration.md](configuration.md)         | Environment variables and Spring profiles       |
| [observability.md](observability.md)         | Logs, traces, Prometheus metrics, Grafana       |
| [resilience.md](resilience.md)               | Timeouts, retries, circuit breakers, fallbacks  |
| [deployment.md](deployment.md)               | Docker images, Compose, Kubernetes              |
| [testing.md](testing.md)                     | Unit, application, Testcontainers coverage      |
| [demos.md](demos.md)                         | Scripted scenarios for a live stack             |

## Directing principle

```
Identity → Authorization → Tenant Isolation → Business Rules
        → Transaction → Ledger → Event → Audit → Observability
```

Skipping a step on a financial write path is a design defect.
