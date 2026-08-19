# Configuration

Copy `.env.example` for local Compose / IDE runs. Do not commit `.env`.

## Environment variables

| Variable                            | Default (local)                                    | Used by                              |
| ----------------------------------- | -------------------------------------------------- | ------------------------------------ |
| `SERVER_PORT`                       | service-specific                                   | All apps                             |
| `DB_USERNAME`                       | `banking`                                          | Domain services                      |
| `DB_PASSWORD`                       | `banking`                                          | Domain services                      |
| `CUSTOMER_DB_URL`                   | `jdbc:postgresql://localhost:5432/customer_db`     | customer-service                     |
| `ACCOUNT_DB_URL`                    | `jdbc:postgresql://localhost:5432/account_db`      | account-service                      |
| `TRANSACTION_DB_URL`                | `jdbc:postgresql://localhost:5432/transaction_db`  | transaction-service                  |
| `AUDIT_DB_URL`                      | `jdbc:postgresql://localhost:5432/audit_db`        | audit-service                        |
| `KEYCLOAK_ISSUER`                   | `http://localhost:8085/realms/banking`             | All (JWT + client credentials)       |
| `KAFKA_BOOTSTRAP_SERVERS`           | `localhost:9092`                                   | transaction-service, audit-service   |
| `ACCOUNT_SERVICE_URL`               | `http://localhost:8082`                            | transaction-service, gateway         |
| `CUSTOMER_SERVICE_URL`              | `http://localhost:8081`                            | gateway                              |
| `TRANSACTION_SERVICE_URL`           | `http://localhost:8083`                            | gateway                              |
| `AUDIT_SERVICE_URL`                 | `http://localhost:8084`                            | gateway                              |
| `TRANSACTION_SERVICE_CLIENT_ID`     | `transaction-service`                              | transaction-service S2S              |
| `TRANSACTION_SERVICE_CLIENT_SECRET` | `transaction-service-secret`                       | transaction-service S2S              |
| `REDIS_HOST` / `REDIS_PORT`         | `localhost` / `6379`                               | api-gateway rate limiter             |
| `OTEL_EXPORTER_OTLP_ENDPOINT`       | `http://localhost:4318/v1/traces`                  | All (Micrometer OTLP)                |
| `JAVA_OPTS`                         | `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75` | Docker images                        |
| `banking.outbox.poll-interval-ms`   | `500`                                              | transaction-service outbox publisher |

Inside Compose, `KEYCLOAK_ISSUER` is `http://host.docker.internal:8085/realms/banking` so containers can validate JWTs issued for hostname `localhost:8085`.

## Spring profiles

| Profile    | Module      | Effect                                                                                                                        |
| ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `no-redis` | api-gateway | Drops Redis auto-config and the default `RequestRateLimiter` filter. Use when running the gateway from the IDE without Redis. |

Activate:

```bash
SPRING_PROFILES_ACTIVE=no-redis
```

## Fixed application settings (not env)

- JPA `ddl-auto: validate`, Flyway on, UTC JDBC timezone, `open-in-view: false`.
- Kafka producer: `acks=all`, idempotent producer.
- Audit consumer group: `audit-service`, `auto-offset-reset: earliest`.
- Actuator exposure: `health`, `info`, `prometheus`, `metrics` (gateway also `gateway`).
- Tracing sample probability: `1.0` (local).
- Resilience4j `accountService`: 3s timeout, 3 retries × 200ms on I/O, CB window 10 / 50% / 10s open.

## Keycloak (Compose)

| Setting      | Value                               |
| ------------ | ----------------------------------- |
| Image        | `quay.io/keycloak/keycloak:26.2`    |
| Admin        | `admin` / `admin`                   |
| HTTP         | host `8085` → container `8080`      |
| Realm import | `infra/keycloak/banking-realm.json` |

Clients: `banking-frontend` (public, PKCE), `banking-api` (confidential), `transaction-service` (confidential, service account). User attribute mapper `tenant_id` is copied into the access token.

## PostgreSQL bootstrap

`infra/postgres/init.sql` creates user `banking` and databases `customer_db`, `account_db`, `transaction_db`, `audit_db`, `keycloak`. Flyway owns schema inside each app database.
