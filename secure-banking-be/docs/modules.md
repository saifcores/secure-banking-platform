# Modules

Maven parent: `com.securebank:secure-banking-platform:1.0.0-SNAPSHOT` (`packaging: pom`). Java 21, Spring Boot **3.4.5**, Spring Cloud **2024.0.1**.

```
secure-banking-be/
├── pom.xml
├── libs/
│   ├── common-domain      domain types, rules, errors (no Spring)
│   ├── common-web         exception handler, correlation, HTTP metrics
│   └── common-security    JWT, tenant context, Hibernate filter, resource-server config
├── services/
│   ├── api-gateway        Spring Cloud Gateway (WebFlux)
│   ├── customer-service
│   ├── account-service
│   ├── transaction-service
│   └── audit-service
└── infra/                 Compose, Keycloak realm, Postgres init, K8s, OTel, Prometheus
```

Shared libraries are consumed as Maven modules (`com.securebank:common-*`). They are **not** published to a remote repository.

## common-domain

No Spring. Pure domain used by every service.

| Type                                            | Role                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `Role` / `Permission`                           | RBAC matrix (`CUSTOMER` … `SERVICE`)                                                               |
| `Tenant`                                        | `BANK_DAKAR`, `BANK_ABIDJAN`, `BANK_BAMAKO`, `PLATFORM` + account prefixes                         |
| `TransferRules`                                 | Existence of distinct accounts, same tenant, status, currency, positive amount, sufficient balance |
| `TransactionStatus` / `TransactionStateMachine` | `CREATED → PROCESSING → COMPLETED → REVERSED` and `* → FAILED`                                     |
| `LedgerPosting` / `LedgerValidator`             | Double-entry: Σ debit = Σ credit                                                                   |
| `AccountStatus`                                 | `ACTIVE` (operable), `BLOCKED`, `CLOSED`                                                           |
| `ErrorCode` / `BusinessException`               | Typed failures with HTTP status                                                                    |
| `KafkaTopics`                                   | `banking.transaction.events`, `banking.audit.events`, `banking.security.events`                    |
| `CurrentPrincipal`                              | `userId`, `username`, `tenantId`, roles, permissions, service-account flag                         |
| `DomainEvent`                                   | Shared event envelope                                                                              |

Tests live next to the types (`RolePermissionMatrixTest`, `TransferRulesTest`, `LedgerValidatorTest`, `TransactionStateMachineTest`).

## common-web

Spring Boot auto-configuration (`CommonWebAutoConfiguration`).

| Class                    | Role                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `GlobalExceptionHandler` | Maps `BusinessException`, validation, 401/403, unexpected errors to `ApiError` JSON |
| `ApiError`               | `timestamp`, `status`, `code`, `message`, `traceId`, `path`                         |
| `CorrelationIdFilter`    | Reads/writes `X-Correlation-Id`, stores it in MDC                                   |
| `RequestMetricsFilter`   | Micrometer `requests_total` and `request_duration`                                  |

Public actuator, OpenAPI, and health paths are left to each service’s security config.

## common-security

Spring Boot auto-configuration (`CommonSecurityAutoConfiguration`). `@EnableMethodSecurity` on the resource-server chain.

| Class                               | Role                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `BankingJwtAuthenticationConverter` | Realm roles → `ROLE_*` + permission authorities (`account:read`, …)                      |
| `ResourceServerSecurityConfig`      | Stateless JWT resource server; permits `/actuator/health`, `/v3/api-docs`, `/swagger-ui` |
| `TenantContext`                     | Thread-local `tenant_id`                                                                 |
| `TenantContextFilter`               | Resolves tenant from JWT / `X-Tenant-Id` (admin & SERVICE may override)                  |
| `TenantGuard`                       | Same-tenant check; CUSTOMER horizontal ownership check                                   |
| `TenantAwareEntity`                 | Mapped superclass: `tenant_id`, timestamps, Hibernate `tenantFilter`                     |
| `TenantHibernateFilterEnabler`      | Enables the filter on each session                                                       |
| `TenantFilterBypass`                | Try-with-resources to load by id, then `TenantGuard` (403 instead of a silent 404)       |
| `SecurityUtils`                     | Current `CurrentPrincipal` from the security context                                     |

## Services

Each domain service is a Spring Boot JAR with Flyway, JPA (`ddl-auto: validate`), OAuth2 resource server, springdoc, and Micrometer.

| Module                | Port | Owns                                                                                  | Calls                                              |
| --------------------- | ---- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `api-gateway`         | 8080 | Routing, JWT at the edge, Redis rate limit, correlation ID, per-route circuit breaker | All public APIs                                    |
| `customer-service`    | 8081 | Customer profiles, Keycloak user link                                                 | —                                                  |
| `account-service`     | 8082 | Accounts, balances, optimistic `version`, internal transfer                           | —                                                  |
| `transaction-service` | 8083 | Transfer orchestration, ledger, idempotency, outbox publisher                         | Account internal API via OAuth2 client credentials |
| `audit-service`       | 8084 | Kafka consumers, immutable `audit_events`, query API                                  | —                                                  |

Internal account APIs (`/internal/v1/accounts/**`) are **not** routed by the gateway. Only `transaction-service` is meant to call them.

## Typical package layout (domain service)

```
com.securebank.<service>/
├── <Service>Application.java
├── api/            controllers + DTOs
├── config/         OpenAPI, Kafka, WebClient
├── domain/         JPA entities + repositories
├── service/        application services
└── client/         outbound HTTP (transaction-service only)
```
