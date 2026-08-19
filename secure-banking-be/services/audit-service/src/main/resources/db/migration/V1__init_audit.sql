CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    aggregate_type VARCHAR(64),
    aggregate_id VARCHAR(64),
    actor_id VARCHAR(128),
    action VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    payload TEXT,
    trace_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_audit_tenant ON audit_events (tenant_id, created_at DESC);
CREATE INDEX idx_audit_type ON audit_events (event_type);
CREATE INDEX idx_audit_actor ON audit_events (actor_id);
