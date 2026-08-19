# HTTP API

Public traffic goes through the **API Gateway** (`http://localhost:8080`). Resource servers also expose the same paths directly on their ports for local debugging.

OpenAPI:

- Aggregated Swagger UI: http://localhost:8080/swagger-ui.html
- Per service: `http://localhost:808x/swagger-ui.html`

Unless noted, every public endpoint requires:

```http
Authorization: Bearer <access_token>
```

Optional / contextual headers:

| Header             | Who sets it                                       | Purpose                                       |
| ------------------ | ------------------------------------------------- | --------------------------------------------- |
| `X-Correlation-Id` | Client or gateway                                 | End-to-end request id; echoed on the response |
| `X-Tenant-Id`      | `ADMIN` / `SERVICE` (or a matching non-admin JWT) | Tenant override / S2S propagation             |
| `Idempotency-Key`  | Client                                            | Required on `POST /api/v1/transactions`       |

Error body (all services): see [errors.md](errors.md).

---

## Customers — `/api/v1/customers`

Service: `customer-service` (8081). Gateway route: `/api/v1/customers/**`.

| Method | Path                     | Authority         | Notes                                                                     |
| ------ | ------------------------ | ----------------- | ------------------------------------------------------------------------- |
| `GET`  | `/api/v1/customers`      | `customer:read`   | CUSTOMER sees only self; staff see the tenant list                        |
| `GET`  | `/api/v1/customers/me`   | `customer:read`   | Profile linked to JWT `sub` (or email fallback)                           |
| `GET`  | `/api/v1/customers/{id}` | `customer:read`   | Cross-tenant → `403 TENANT_ACCESS_DENIED`; CUSTOMER may only read own row |
| `PUT`  | `/api/v1/customers/{id}` | `customer:update` | OPERATOR / ADMIN (CUSTOMER only if own profile)                           |

### `CustomerResponse`

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "tenantId": "BANK_DAKAR",
  "keycloakUserId": "<sub or placeholder until first login>",
  "firstName": "Awa",
  "lastName": "Diop",
  "email": "awa.diop@bank-dakar.local",
  "phone": "+221770000001",
  "status": "ACTIVE",
  "createdAt": "2026-08-19T12:00:00Z",
  "updatedAt": "2026-08-19T12:00:00Z"
}
```

### `PUT` body — `UpdateCustomerRequest`

```json
{
  "firstName": "Awa",
  "lastName": "Diop",
  "email": "awa.diop@bank-dakar.local",
  "phone": "+221770000001"
}
```

`firstName` and `lastName` are required; `email` must be valid if present.

On first login, if `keycloak_user_id` is still a seed placeholder, the service binds the JWT `sub` when the email matches.

---

## Accounts — `/api/v1/accounts`

Service: `account-service` (8082). Gateway route: `/api/v1/accounts/**`.

| Method | Path                    | Authority        | Notes                                                 |
| ------ | ----------------------- | ---------------- | ----------------------------------------------------- |
| `GET`  | `/api/v1/accounts`      | `account:read`   | CUSTOMER: own accounts (`owner_user_id` / email bind) |
| `GET`  | `/api/v1/accounts/{id}` | `account:read`   | Loads without tenant filter, then `TenantGuard`       |
| `POST` | `/api/v1/accounts`      | `account:create` | OPERATOR / ADMIN. Number = tenant prefix + 6 digits   |
| `PUT`  | `/api/v1/accounts/{id}` | `account:update` | Status only: `ACTIVE` \| `BLOCKED` \| `CLOSED`        |

### `POST` body — `CreateAccountRequest`

```json
{
  "customerId": "11111111-1111-1111-1111-111111111111",
  "ownerUserId": "<keycloak sub>",
  "ownerEmail": "awa.diop@bank-dakar.local",
  "currency": "XOF",
  "initialBalance": 0
}
```

`customerId` and `ownerUserId` are required. Currency defaults to the tenant default (`XOF`). Balance defaults to `0`.

### `AccountResponse`

```json
{
  "id": "aaaa1111-1111-1111-1111-111111111111",
  "accountNumber": "DK001234",
  "customerId": "11111111-1111-1111-1111-111111111111",
  "tenantId": "BANK_DAKAR",
  "currency": "XOF",
  "balance": 500000.00,
  "status": "ACTIVE",
  "createdAt": "2026-08-19T12:00:00Z",
  "updatedAt": "2026-08-19T12:00:00Z"
}
```

Seeded accounts: `DK001234`, `DK005678` (BANK_DAKAR), `AB001234` (BANK_ABIDJAN). Cross-tenant demo id: `bbbb1111-1111-1111-1111-111111111111`.

---

## Transactions — `/api/v1/transactions`

Service: `transaction-service` (8083). Gateway route: `/api/v1/transactions/**`.

| Method | Path                               | Authority            | Notes                                                               |
| ------ | ---------------------------------- | -------------------- | ------------------------------------------------------------------- |
| `POST` | `/api/v1/transactions`             | `transaction:create` | **Requires** `Idempotency-Key`. CUSTOMER may only debit own account |
| `GET`  | `/api/v1/transactions`             | `transaction:read`   | Tenant-scoped list                                                  |
| `GET`  | `/api/v1/transactions/{id}`        | `transaction:read`   | Bypass filter + `TenantGuard`                                       |
| `POST` | `/api/v1/transactions/{id}/cancel` | `transaction:cancel` | Reverses a **COMPLETED** transfer                                   |

### `POST` body — `CreateTransactionRequest`

```http
POST /api/v1/transactions
Idempotency-Key: ABC123
Content-Type: application/json
```

```json
{
  "sourceAccount": "DK001234",
  "destinationAccount": "DK005678",
  "amount": 150000,
  "currency": "XOF"
}
```

Amount must be `>= 0.01`. Same source and destination, cross-tenant, blocked/closed accounts, currency mismatch, and insufficient funds are rejected (see [errors.md](errors.md)).

Replay: same key + same payload returns the original transaction. Same key + different payload → `409 IDEMPOTENCY_KEY_CONFLICT`. Missing key → `400 VALIDATION_ERROR`.

### `TransactionResponse`

```json
{
  "id": "…",
  "reference": "TX-…",
  "tenantId": "BANK_DAKAR",
  "sourceAccount": "DK001234",
  "destinationAccount": "DK005678",
  "amount": 150000,
  "currency": "XOF",
  "status": "COMPLETED",
  "failureReason": null,
  "ledgerEntries": [
    { "id": "…", "accountNumber": "DK001234", "entryType": "DEBIT", "amount": 150000, "currency": "XOF" },
    { "id": "…", "accountNumber": "DK005678", "entryType": "CREDIT", "amount": 150000, "currency": "XOF" }
  ],
  "createdAt": "2026-08-19T12:00:00Z",
  "updatedAt": "2026-08-19T12:00:00Z"
}
```

Statuses: `CREATED`, `PROCESSING`, `COMPLETED`, `FAILED`, `REVERSED`. Cancel posts a reverse movement with key `reverse-{transactionId}` and extra ledger lines.

---

## Audit — `/api/v1/audit`

Service: `audit-service` (8084). Gateway route: `/api/v1/audit/**`.

| Method | Path                 | Authority    | Notes                                        |
| ------ | -------------------- | ------------ | -------------------------------------------- |
| `GET`  | `/api/v1/audit`      | `audit:read` | Spring Data `Pageable`; optional `eventType` |
| `GET`  | `/api/v1/audit/{id}` | `audit:read` | `TenantGuard` on the stored tenant           |

Query: `?eventType=TransactionCompleted&page=0&size=20&sort=createdAt,desc`.

AUDITOR / ADMIN. PLATFORM auditor typically passes `X-Tenant-Id: BANK_DAKAR` to inspect a bank.

### `AuditEventResponse`

```json
{
  "id": "…",
  "tenantId": "BANK_DAKAR",
  "eventType": "TransactionCompleted",
  "aggregateType": "Transaction",
  "aggregateId": "…",
  "actorId": "<sub>",
  "action": "TransactionCompleted",
  "status": "COMPLETED",
  "payload": "{…}",
  "traceId": "…",
  "createdAt": "2026-08-19T12:00:00Z"
}
```

---

## Internal account API (not on the gateway)

Base: `http://localhost:8082/internal/v1/accounts`. Callers need `ROLE_SERVICE` or `account:read` / `account:update`. `transaction-service` uses **client credentials** and forwards `X-Tenant-Id` + `X-Correlation-Id`.

| Method | Path                                              | Authority                          | Notes                                                              |
| ------ | ------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `GET`  | `/internal/v1/accounts/by-number/{accountNumber}` | `ROLE_SERVICE` or `account:read`   | Snapshot for transfer rules                                        |
| `POST` | `/internal/v1/accounts/transfers`                 | `ROLE_SERVICE` or `account:update` | Debit + credit in **one** DB transaction. Header `Idempotency-Key` |
| `POST` | `/internal/v1/accounts/transfers/reverse`         | `ROLE_SERVICE` or `account:update` | Swaps source/destination; key becomes `{key}:reverse`              |

### Transfer body

```json
{
  "sourceAccount": "DK001234",
  "destinationAccount": "DK005678",
  "amount": 150000,
  "currency": "XOF",
  "transactionId": "optional"
}
```

Accounts are locked with `SELECT … FOR UPDATE`. Optimistic `version` on `accounts` guards concurrent updates.

---

## Gateway-only

| Path                                                    | Auth   | Behaviour                                       |
| ------------------------------------------------------- | ------ | ----------------------------------------------- |
| `/fallback/{service}`                                   | Public | Circuit-breaker fallback → `503 INTERNAL_ERROR` |
| `/actuator/health`, `/actuator/prometheus`              | Public | Health and metrics                              |
| `/customers\|accounts\|transactions\|audit/v3/api-docs` | Public | Proxied OpenAPI specs for the aggregated UI     |

Rate limit (Redis): 30 requests/s replenish, burst 60, keyed by authenticated principal. Profile `no-redis` disables the filter for IDE use without Redis.

---

## Permission cheat sheet

| Authority            | CUSTOMER | OPERATOR | SUPPORT | AUDITOR | ADMIN | SERVICE |
| -------------------- | -------- | -------- | ------- | ------- | ----- | ------- |
| `account:read`       | ✓        | ✓        | ✓       |         | ✓     | ✓       |
| `account:create`     |          | ✓        |         |         | ✓     |         |
| `account:update`     |          | ✓        |         |         | ✓     | ✓       |
| `transaction:read`   | ✓        | ✓        | ✓       |         | ✓     | ✓       |
| `transaction:create` | ✓        | ✓        |         |         | ✓     |         |
| `transaction:cancel` |          | ✓        |         |         | ✓     |         |
| `customer:read`      | ✓        | ✓        | ✓       |         | ✓     | ✓       |
| `customer:update`    |          | ✓        |         |         | ✓     |         |
| `audit:read`         |          |          |         | ✓       | ✓     |         |
| `admin`              |          |          |         |         | ✓     |         |
