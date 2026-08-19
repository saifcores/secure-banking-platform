# Local development

## Prerequisites

- JDK **21** (Temurin is used in Docker: `eclipse-temurin:21-jre-alpine`)
- Maven Wrapper (`./mvnw`) — no global Maven required
- Docker Engine with Compose v2
- Optional: `jq`, SDKMAN (`21.0.8-tem`)

## Full stack (recommended for demos)

From `secure-banking-be`:

```bash
export JAVA_HOME="$HOME/.sdkman/candidates/java/21.0.8-tem"
./mvnw -DskipTests package
docker compose up --build
```

Wait until Keycloak has imported realm `banking` and each service reports healthy. Then follow [demos.md](demos.md).

| URL                                   | What                                       |
| ------------------------------------- | ------------------------------------------ |
| http://localhost:8080                 | API gateway                                |
| http://localhost:8080/swagger-ui.html | Aggregated OpenAPI                         |
| http://localhost:8085                 | Keycloak (admin / admin)                   |
| http://localhost:8090                 | Kafka UI                                   |
| http://localhost:9090                 | Prometheus                                 |
| http://localhost:3000                 | Grafana (admin / admin, anonymous enabled) |

## Infrastructure only (run apps in the IDE)

```bash
docker compose up postgres keycloak kafka kafka-ui redis otel-collector
```

Then start, in any order except gateway last:

1. `customer-service` — `CustomerServiceApplication`
2. `account-service` — `AccountServiceApplication`
3. `transaction-service` — `TransactionServiceApplication`
4. `audit-service` — `AuditServiceApplication`
5. `api-gateway` — `ApiGatewayApplication` with `SPRING_PROFILES_ACTIVE=no-redis` if Redis is down

Issuer defaults to `http://localhost:8085/realms/banking`. Datasource URLs default to localhost databases created by `infra/postgres/init.sql`.

## Seed data

Flyway seeds customers and accounts. Keycloak seeds users (password `Password123!` for all).

| User             | Role     | Tenant       | Linked customer / accounts        |
| ---------------- | -------- | ------------ | --------------------------------- |
| `awa.diop`       | CUSTOMER | BANK_DAKAR   | Awa Diop · `DK001234`, `DK005678` |
| `koffi.yao`      | CUSTOMER | BANK_ABIDJAN | Koffi Yao · `AB001234`            |
| `mamadou.ndiaye` | OPERATOR | BANK_DAKAR   | Mamadou Ndiaye (staff profile)    |
| `support.dakar`  | SUPPORT  | BANK_DAKAR   | —                                 |
| `auditor`        | AUDITOR  | PLATFORM     | —                                 |
| `admin`          | ADMIN    | PLATFORM     | —                                 |

Customer `keycloak_user_id` starts as a placeholder; the first authenticated request with a matching email binds JWT `sub`.

## Tests

```bash
./mvnw test
```

See [testing.md](testing.md). Testcontainers isolation tests skip if the Docker Engine API is too old; unit tests still cover cross-tenant denial.

## Useful curls

Password grant is **demo-only**. Production-like UX is Authorization Code + PKCE with `banking-frontend`.

```bash
token() {
  curl -s -X POST http://localhost:8085/realms/banking/protocol/openid-connect/token \
    -d grant_type=password -d client_id=banking-frontend \
    -d username="$1" -d password=Password123! | jq -r .access_token
}

export TOKEN=$(token awa.diop)
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/accounts | jq
```

## Frontend

`secure-banking-fe` is a Vite + React scaffold. It is **not** wired to Keycloak or the gateway yet. `npm install && npm run dev` starts the template on the Vite default port.

## Troubleshooting

| Symptom                        | Check                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 401 from gateway               | Keycloak up, issuer URL, token not expired (access tokens ~15 min)                                       |
| 401 from a service, gateway OK | Same `KEYCLOAK_ISSUER`; in Docker JWKS must be reachable via `host.docker.internal`                      |
| Gateway fails to start         | Redis missing → use `no-redis`                                                                           |
| Transfers hang / 503           | Account-service down or circuit open; Kafka not required for the HTTP path, only for audit               |
| Empty audit list               | Outbox publisher + Kafka + `audit-service` consumer; inspect Kafka UI topic `banking.transaction.events` |
| Cross-tenant 403               | Expected for `BANK_DAKAR` → `bbbb1111-1111-1111-1111-111111111111`                                       |
