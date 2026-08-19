# Data model

PostgreSQL, database-per-service. Tenant-aware tables always include `tenant_id`.

## customer_db.customers

`id, tenant_id, keycloak_user_id, first_name, last_name, email, phone, status, created_at, updated_at`

Unique `(tenant_id, keycloak_user_id)`, `(tenant_id, email)`.

## account_db.accounts

`id, tenant_id, account_number, customer_id, owner_user_id, owner_email, currency, balance, status, version, created_at, updated_at`

Statuses: `ACTIVE | BLOCKED | CLOSED`.

## account_db.account_idempotency_records

`(tenant_id, idempotency_key)` PK, `request_hash`, `response_body`, `status_code`.

## transaction_db.transactions

`id, tenant_id, reference, source_account, destination_account, source_account_id, destination_account_id, amount, currency, status, failure_reason, initiated_by, created_at, updated_at`

Statuses: `CREATED → PROCESSING → COMPLETED → REVERSED`, and `* → FAILED` from `CREATED`/`PROCESSING`.

## transaction_db.ledger_entries

`id, tenant_id, transaction_id, account_id, account_number, entry_type (DEBIT|CREDIT), amount, currency, created_at, updated_at`

Invariant: for a posting, Σ debit = Σ credit.

## transaction_db.outbox_events

`id, tenant_id, topic, aggregate_type, aggregate_id, event_type, payload, created_at, published_at`

Polled with `FOR UPDATE SKIP LOCKED`.

## transaction_db.idempotency_records

Same shape as account idempotency; stores `transaction_id`.

## audit_db.audit_events

`id, tenant_id, event_type, aggregate_type, aggregate_id, actor_id, action, status, payload, trace_id, created_at, updated_at`
