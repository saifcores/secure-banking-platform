CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    account_number VARCHAR(32) NOT NULL,
    customer_id UUID NOT NULL,
    owner_user_id VARCHAR(128) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    currency VARCHAR(8) NOT NULL,
    balance NUMERIC(18, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_accounts_number UNIQUE (account_number),
    CONSTRAINT uk_accounts_tenant_number UNIQUE (tenant_id, account_number)
);

CREATE INDEX idx_accounts_tenant ON accounts (tenant_id);
CREATE INDEX idx_accounts_customer ON accounts (customer_id);
CREATE INDEX idx_accounts_owner ON accounts (owner_user_id);

CREATE TABLE account_idempotency_records (
    tenant_id VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(128) NOT NULL,
    account_id UUID,
    response_body TEXT,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (tenant_id, idempotency_key)
);

INSERT INTO accounts (id, tenant_id, account_number, customer_id, owner_user_id, owner_email, currency, balance, status, created_at, updated_at, version)
VALUES
    ('aaaa1111-1111-1111-1111-111111111111', 'BANK_DAKAR', 'DK001234', '11111111-1111-1111-1111-111111111111', 'placeholder-dakar-customer', 'awa.diop@bank-dakar.local', 'XOF', 500000.00, 'ACTIVE', NOW(), NOW(), 0),
    ('aaaa2222-2222-2222-2222-222222222222', 'BANK_DAKAR', 'DK005678', '11111111-1111-1111-1111-111111111111', 'placeholder-dakar-customer', 'awa.diop@bank-dakar.local', 'XOF', 250000.00, 'ACTIVE', NOW(), NOW(), 0),
    ('bbbb1111-1111-1111-1111-111111111111', 'BANK_ABIDJAN', 'AB001234', '22222222-2222-2222-2222-222222222222', 'placeholder-abidjan-customer', 'koffi.yao@bank-abidjan.local', 'XOF', 800000.00, 'ACTIVE', NOW(), NOW(), 0);
