# Secure Multi-Tenant Banking Platform

Portfolio / architecture lab for a **secure multi-tenant banking platform**. It demonstrates OAuth2/OIDC, IAM, tenant isolation, financial transfers, double-entry ledger, idempotency, transactional outbox, and service-to-service security.

This is **not** a production core-banking system. Every financial write is designed around one chain:

**Identity → Authorization → Tenant Isolation → Business Rules → Transaction → Ledger → Event → Audit → Observability**

## Repository layout

```
secure-banking-platform/
├── README.md                 ← this file
├── secure-banking-be/        Spring Boot 3.4 backend (Maven multi-module)
└── secure-banking-fe/        React + Vite SPA (scaffold; not yet wired to the API)
```

| Part                                    | Status      | Purpose                                                                                         |
| --------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| [secure-banking-be](secure-banking-be/) | Implemented | API gateway, four domain services, Keycloak, Kafka, PostgreSQL, observability                   |
| [secure-banking-fe](secure-banking-fe/) | Scaffold    | Vite + React 19 + TypeScript template. Intended as the PKCE browser client (`banking-frontend`) |

Full backend documentation lives in [secure-banking-be/docs](secure-banking-be/docs/README.md).

## Runtime (local)

```
Browser / curl
      │  Authorization Code + PKCE  (or password grant for demos)
      ▼
  Keycloak :8085  realm `banking`
      │  Bearer JWT
      ▼
  API Gateway :8080   JWT · rate limit · correlation ID · circuit breaker
      │
      ├── Customer Service     :8081   profiles
      ├── Account Service      :8082   balances, atomic debit/credit
      ├── Transaction Service  :8083   transfers, ledger, outbox
      └── Audit Service        :8084   Kafka consumers + audit query
               │
               ├── PostgreSQL  :5432   customer_db / account_db / transaction_db / audit_db / keycloak
               ├── Kafka       :9092   banking.transaction.events
               ├── Redis       :6379   gateway rate limiting
               ├── Kafka UI    :8090
               ├── Prometheus  :9090
               └── Grafana     :3000
```

## Stack

| Layer              | Choice                                                   |
| ------------------ | -------------------------------------------------------- |
| Language / runtime | Java 21                                                  |
| Framework          | Spring Boot 3.4, Spring Security 6, Spring Cloud Gateway |
| Identity           | Keycloak 26 (OIDC), realm `banking`                      |
| Data               | PostgreSQL 16, Flyway, Hibernate filters                 |
| Messaging          | Kafka 3.9, transactional outbox                          |
| Resilience         | Resilience4j (timeout, retry, circuit breaker)           |
| Observability      | Micrometer, Prometheus, OpenTelemetry, Grafana           |
| Frontend (planned) | React 19, TypeScript, Vite 8                             |

## Quick start (backend)

Java 21 and Docker are required.

```bash
cd secure-banking-be
export JAVA_HOME="$HOME/.sdkman/candidates/java/21.0.8-tem"   # or your JDK 21
./mvnw -DskipTests package
docker compose up --build
```

Then:

- Gateway + Swagger: http://localhost:8080/swagger-ui.html
- Keycloak: http://localhost:8085 (admin / admin)
- Grafana: http://localhost:3000 (admin / admin)

Demo password for all seeded users: `Password123!`

```bash
TOKEN=$(curl -s -X POST http://localhost:8085/realms/banking/protocol/openid-connect/token \
  -d grant_type=password -d client_id=banking-frontend \
  -d username=awa.diop -d password=Password123! | jq -r .access_token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/accounts
```

See [local development](secure-banking-be/docs/local-development.md) for IDE-only runs, tests, and environment variables.

## Documentation map

| Topic               | File                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| Documentation index | [secure-banking-be/docs/README.md](secure-banking-be/docs/README.md) |
| Architecture        | [architecture.md](secure-banking-be/docs/architecture.md)            |
| Glossary            | [glossary.md](secure-banking-be/docs/glossary.md)                    |
| C4 diagrams         | [c4.md](secure-banking-be/docs/c4.md)                                |
| HTTP API            | [api.md](secure-banking-be/docs/api.md)                              |
| Security & RBAC     | [security-model.md](secure-banking-be/docs/security-model.md)        |
| OAuth2 / OIDC       | [oauth2-flows.md](secure-banking-be/docs/oauth2-flows.md)            |
| Demo scripts        | [demos.md](secure-banking-be/docs/demos.md)                          |

## Secrets

Compose credentials (`banking` / `Password123!` / `transaction-service-secret`) are **local demos only**. Do not commit real secrets. Kubernetes manifests in `secure-banking-be/infra/k8s/` use placeholder `Secret` values.
