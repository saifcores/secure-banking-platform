CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    reference VARCHAR(32) NOT NULL,
    source_account VARCHAR(32) NOT NULL,
    destination_account VARCHAR(32) NOT NULL,
    source_account_id UUID,
    destination_account_id UUID,
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL,
    status VARCHAR(32) NOT NULL,
    failure_reason VARCHAR(255),
    initiated_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_transactions_reference UNIQUE (reference)
);

CREATE INDEX idx_transactions_tenant ON transactions (tenant_id);
CREATE INDEX idx_transactions_status ON transactions (tenant_id, status);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    transaction_id UUID NOT NULL REFERENCES transactions (id),
    account_id UUID NOT NULL,
    account_number VARCHAR(32) NOT NULL,
    entry_type VARCHAR(16) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ledger_tx ON ledger_entries (transaction_id);
CREATE INDEX idx_ledger_tenant ON ledger_entries (tenant_id);

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    topic VARCHAR(128) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_pending ON outbox_events (created_at) WHERE published_at IS NULL;

CREATE TABLE idempotency_records (
    tenant_id VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(128) NOT NULL,
    transaction_id UUID,
    response_body TEXT,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (tenant_id, idempotency_key)
);
