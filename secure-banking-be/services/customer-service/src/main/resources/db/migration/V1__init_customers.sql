CREATE TABLE customers (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    keycloak_user_id VARCHAR(128) NOT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(40),
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_customers_tenant_user UNIQUE (tenant_id, keycloak_user_id),
    CONSTRAINT uk_customers_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_customers_tenant ON customers (tenant_id);
CREATE INDEX idx_customers_user ON customers (keycloak_user_id);

INSERT INTO customers (id, tenant_id, keycloak_user_id, first_name, last_name, email, phone, status, created_at, updated_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'BANK_DAKAR', 'placeholder-dakar-customer', 'Awa', 'Diop', 'awa.diop@bank-dakar.local', '+221770000001', 'ACTIVE', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'BANK_ABIDJAN', 'placeholder-abidjan-customer', 'Koffi', 'Yao', 'koffi.yao@bank-abidjan.local', '+2250700000001', 'ACTIVE', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'BANK_DAKAR', 'placeholder-dakar-operator', 'Mamadou', 'Ndiaye', 'mamadou.ndiaye@bank-dakar.local', '+221770000002', 'ACTIVE', NOW(), NOW());
