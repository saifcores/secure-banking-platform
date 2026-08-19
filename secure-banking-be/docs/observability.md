# Observability

Every service logs and traces with the same fields: **trace**, **span**, **tenant**, **user**, **service**.

Console pattern (resource servers):

```
%d{yyyy-MM-dd'T'HH:mm:ss.SSSXXX} trace=%X{traceId:-} span=%X{spanId:-} tenant=%X{tenantId:-} user=%X{userId:-} service=${spring.application.name} %5p %m%n
```

MDC is filled by:

- `CorrelationIdFilter` / gateway `X-Correlation-Id`
- `TenantContextFilter` (`tenantId`, `userId`)
- Micrometer Tracing (`traceId`, `spanId`)

## Tracing

- Sampling: `management.tracing.sampling.probability: 1.0` (local).
- Export: OTLP HTTP `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318/v1/traces`).
- Collector: `infra/otel/otel-collector.yml` — OTLP gRPC `:4317`, HTTP `:4318`, debug exporter, Prometheus exporter `:8889`.

S2S calls forward `X-Correlation-Id` from transaction-service to account-service.

## Metrics

Actuator: `/actuator/prometheus` on every service (gateway `:8080`, … audit `:8084`).

Prometheus scrape config: `infra/prometheus/prometheus.yml` (10s interval). Grafana datasource points at `http://prometheus:9090`.

| Metric                          | Source                 | Meaning                                 |
| ------------------------------- | ---------------------- | --------------------------------------- |
| `requests_total`                | `RequestMetricsFilter` | HTTP request count                      |
| `request_duration`              | `RequestMetricsFilter` | HTTP duration timer                     |
| `transaction_success_total`     | `TransactionMetrics`   | Transfers that reached `COMPLETED`      |
| `transaction_failure_total`     | `TransactionMetrics`   | Transfers that failed before completion |
| `resilience4j.circuitbreaker.*` | Resilience4j           | Account-service CB                      |
| `resilience4j.retry.*`          | Resilience4j           | Account-service retries                 |
| JVM / HTTP server               | Spring Boot Actuator   | Standard Micrometer binders             |

## Logs of note

Structured `operation=` keys in application code:

| Logger                                | Examples                                           |
| ------------------------------------- | -------------------------------------------------- |
| `TransferApplicationService`          | `operation=transfer status=COMPLETED\|FAILED`      |
| `OutboxPublisher`                     | `operation=outbox-publish status=SUCCESS\|FAILURE` |
| `TransactionEventConsumer`            | `operation=audit-ingest status=SUCCESS\|FAILURE`   |
| `TenantGuard` / `TenantContextFilter` | `TENANT_ACCESS_DENIED`, `HORIZONTAL_ACCESS_DENIED` |

Do not log tokens, passwords, or client secrets.

## Local UIs

| Port | App                                           |
| ---- | --------------------------------------------- |
| 8090 | Kafka UI — topic `banking.transaction.events` |
| 9090 | Prometheus                                    |
| 3000 | Grafana                                       |

Circuit-breaker demo: stop `account-service`, retry a transfer, watch `resilience4j.circuitbreaker.*` and HTTP `503`.
