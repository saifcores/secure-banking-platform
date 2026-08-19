# Secure Multi-Tenant Banking Platform

A secure, multi-tenant banking platform demonstrating OAuth2/OIDC, IAM, financial transaction processing, idempotency, ledger, event-driven architecture and service-to-service security.

This backend is a **portfolio / architecture lab**, not a full core-banking system. The pedagogical spine is:

**Identity → Authorization → Tenant Isolation → Business Rules → Transaction → Ledger → Event → Audit → Observability**

## Architecture

```
Frontend  →  Keycloak (OAuth2/OIDC)  →  API Gateway  →  Customer / Account / Transaction / Audit
                                                              │
                                                              ├── PostgreSQL (db-per-service)
                                                              └── Kafka (transactional outbox)
```

| Service             | Port | Responsibility                                            |
| ------------------- | ---- | --------------------------------------------------------- |
| api-gateway         | 8080 | Routing, JWT, rate limit, correlation ID, circuit breaker |
| customer-service    | 8081 | Customer profiles                                         |
| account-service     | 8082 | Accounts, balances, atomic debit/credit                   |
| transaction-service | 8083 | Transfers, state machine, ledger, idempotency, outbox     |
| audit-service       | 8084 | Kafka consumers + audit query API                         |
| Keycloak            | 8085 | Realm `banking`                                           |
| Kafka UI            | 8090 | Topic inspection                                          |
| Prometheus          | 9090 | Metrics                                                   |
| Grafana             | 3000 | Dashboards                                                |

## Stack

Java 21 · Spring Boot 3.4 · Spring Security 6 · Spring Cloud Gateway · Keycloak · PostgreSQL · Flyway · Kafka · Resilience4j · OpenTelemetry · Testcontainers

## Quick start

Java 21 and Docker are required.

```bash
export JAVA_HOME="$HOME/.sdkman/candidates/java/21.0.8-tem"   # or your JDK 21
./mvnw -DskipTests package
docker compose up --build
```

Infrastructure only (run Spring apps from the IDE):

```bash
docker compose up postgres keycloak kafka kafka-ui redis otel-collector
```

Then start each service with the `no-redis` profile on the gateway if Redis is down:

```bash
# gateway
SPRING_PROFILES_ACTIVE=no-redis
```

## Demo users

Password for all users: `Password123!`

| User             | Role     | Tenant       |
| ---------------- | -------- | ------------ |
| `awa.diop`       | CUSTOMER | BANK_DAKAR   |
| `koffi.yao`      | CUSTOMER | BANK_ABIDJAN |
| `mamadou.ndiaye` | OPERATOR | BANK_DAKAR   |
| `support.dakar`  | SUPPORT  | BANK_DAKAR   |
| `auditor`        | AUDITOR  | PLATFORM     |
| `admin`          | ADMIN    | PLATFORM     |

Seeded accounts: `DK001234`, `DK005678` (Dakar), `AB001234` (Abidjan).

### 1. Obtain a JWT (Resource Owner Password for local demos)

```bash
curl -s -X POST http://localhost:8085/realms/banking/protocol/openid-connect/token \
  -d grant_type=password \
  -d client_id=banking-frontend \
  -d username=awa.diop \
  -d password=Password123! | jq -r .access_token
```

Production-like UX uses **Authorization Code + PKCE** with `banking-frontend`.

### 2. Call a protected API

```bash
TOKEN=...
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/accounts
```

### 3. Transfer with idempotency

```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ABC123" \
  -d '{"sourceAccount":"DK001234","destinationAccount":"DK005678","amount":150000,"currency":"XOF"}'
```

Repeat the same request: the same transaction is returned, the source account is not debited twice.

## OpenAPI

- Gateway Swagger UI: http://localhost:8080/swagger-ui.html
- Per-service: `http://localhost:808x/swagger-ui.html`

## Tests

```bash
./mvnw test
```

The Testcontainers tenant-isolation suite is skipped automatically if the local Docker Engine API is incompatible. Cross-tenant denial is still covered by unit tests. To force Testcontainers: Docker Engine API ≥ 1.40 and a current Testcontainers client.

Critical coverage:

- transaction state machine
- double-entry ledger invariant
- RBAC permission matrix
- idempotent transfer
- cross-tenant access denied (BANK_DAKAR → BANK_ABIDJAN)

## Documentation

Full index: [docs/README.md](docs/README.md). Platform overview: [../README.md](../README.md).

| Topic               | File                                                   |
| ------------------- | ------------------------------------------------------ |
| Doc index           | [docs/README.md](docs/README.md)                       |
| Glossary            | [docs/glossary.md](docs/glossary.md)                   |
| Global architecture | [docs/architecture.md](docs/architecture.md)           |
| C4                  | [docs/c4.md](docs/c4.md)                               |
| Maven modules       | [docs/modules.md](docs/modules.md)                     |
| HTTP API            | [docs/api.md](docs/api.md)                             |
| Error catalog       | [docs/errors.md](docs/errors.md)                       |
| Sequence diagrams   | [docs/sequence-diagrams.md](docs/sequence-diagrams.md) |
| Data model          | [docs/data-model.md](docs/data-model.md)               |
| OAuth2 flows        | [docs/oauth2-flows.md](docs/oauth2-flows.md)           |
| Security model      | [docs/security-model.md](docs/security-model.md)       |
| Multi-tenancy       | [docs/multi-tenancy.md](docs/multi-tenancy.md)         |
| Idempotence         | [docs/idempotence.md](docs/idempotence.md)             |
| Resilience          | [docs/resilience.md](docs/resilience.md)               |
| Local development   | [docs/local-development.md](docs/local-development.md) |
| Configuration       | [docs/configuration.md](docs/configuration.md)         |
| Observability       | [docs/observability.md](docs/observability.md)         |
| Testing             | [docs/testing.md](docs/testing.md)                     |
| Deployment          | [docs/deployment.md](docs/deployment.md)               |
| Demo scripts        | [docs/demos.md](docs/demos.md)                         |

## Kubernetes

Manifests live in `infra/k8s/`. Secrets are placeholders — replace them before any real deployment. HTTPS terminates at Ingress.

## Secrets policy

Never commit client secrets, DB passwords, or JWT signing keys. Compose uses **local-only** demo credentials (`transaction-service-secret`, `Password123!`). Kubernetes expects Secret objects.
