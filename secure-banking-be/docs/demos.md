# Demo scenarios

Assume Keycloak is on `:8085` and the gateway on `:8080`. Password: `Password123!`.

```bash
token() {
  curl -s -X POST http://localhost:8085/realms/banking/protocol/openid-connect/token \
    -d grant_type=password -d client_id=banking-frontend \
    -d username="$1" -d password=Password123! | jq -r .access_token
}
```

1. **Login** — open Keycloak account console or run `token awa.diop`.
2. **JWT** — `jq -R 'split(".") | .[1] | @base64d | fromjson' <<<"$TOKEN"` and inspect `tenant_id`, `realm_access.roles`.
3. **Protected API** — `curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/accounts`.
4. **Role** — `support.dakar` cannot `POST /api/v1/accounts` (403).
5. **Permission** — `awa.diop` cannot `GET /api/v1/audit` (no `audit:read`).
6. **Tenant isolation** — Dakar token + `GET /api/v1/accounts/bbbb1111-1111-1111-1111-111111111111` → `TENANT_ACCESS_DENIED`.
7. **Create account** — operator `mamadou.ndiaye` `POST /api/v1/accounts`.
8. **Transfer** — `POST /api/v1/transactions` DK001234 → DK005678, 150000 XOF.
9. **Idempotent replay** — same `Idempotency-Key`, same body → same `reference`.
10. **Kafka** — Kafka UI `:8090`, topic `banking.transaction.events`.
11. **Audit** — `token auditor` then `GET /api/v1/audit` (use `X-Tenant-Id: BANK_DAKAR` if needed).
12. **S2S** — transaction-service logs client-credentials calls to account-service `/internal/v1/accounts/transfers`.
13. **Expired token** — wait 15 minutes or tamper JWT → 401.
14. **Circuit breaker** — stop account-service, transfer → 503 / FAILED; metrics `resilience4j.circuitbreaker.*`.
15. **Tracing** — logs contain `trace=` / `span=`; OTLP collector `:4318`.

Prometheus: `requests_total`, `request_duration`, `transaction_success_total`, `transaction_failure_total` on `:8083/actuator/prometheus`.
