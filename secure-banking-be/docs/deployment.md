# Deployment

## Docker images

Single Dockerfile: `infra/docker/Dockerfile`.

```
FROM eclipse-temurin:21-jre-alpine
ARG JAR
COPY ${JAR} app.jar
```

Compose builds each service with a different `JAR` argument, e.g. `services/api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar`. Package first:

```bash
./mvnw -DskipTests package
docker compose build
```

## Docker Compose

File: `docker-compose.yml` (project name `secure-banking`).

Includes Postgres 16, Keycloak 26 (realm import), Kafka KRaft 3.9, Kafka UI, Redis 7, OTel collector, Prometheus, Grafana, and the five Spring apps. Apps wait for Postgres health; the gateway also waits for Redis and the four services.

This is the **local demo** topology. Credentials in Compose are not production-safe.

## Kubernetes

Manifests in `infra/k8s/` (namespace `secure-banking`):

| File                       | Resources                                                                      |
| -------------------------- | ------------------------------------------------------------------------------ |
| `00-namespace-config.yaml` | Namespace, `banking-config` ConfigMap, `banking-secrets` Secret (placeholders) |
| `10-gateway.yaml`          | `api-gateway` Deployment/Service, Ingress `banking.local` with SSL redirect    |
| `20-services.yaml`         | customer / account / transaction / audit Deployments + Services                |

Images are named `securebank/<service>:1.0.0`. Replace secrets (`DB_PASSWORD`, `TRANSACTION_SERVICE_CLIENT_SECRET`, Keycloak/Postgres passwords) before any real cluster. HTTPS is expected to terminate at Ingress.

Readiness: gateway probes `GET /actuator/health`.

This is a **starter** chart-less layout: no Kafka/Postgres/Keycloak operators, no HPA, no NetworkPolicies. Add those before treating it as a production deploy.

## Outbox and Kafka in production-like setups

- Transaction service writes `outbox_events` in the same DB transaction as ledger + status.
- `OutboxPublisher` polls `FOR UPDATE SKIP LOCKED` (batch 50, default 500ms) and publishes to `banking.transaction.events`.
- Audit service consumes as group `audit-service`.

Do not emit Kafka from inside the HTTP request; that breaks atomicity with the ledger.

## Secrets policy

- Never commit `.env`, keystores, or real client secrets.
- Compose = demo only.
- K8s: `Secret` vs `ConfigMap`; rotate `transaction-service` client secret in Keycloak and the Secret together.
