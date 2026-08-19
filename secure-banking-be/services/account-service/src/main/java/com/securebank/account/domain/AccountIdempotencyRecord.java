package com.securebank.account.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "account_idempotency_records")
@IdClass(AccountIdempotencyRecord.Pk.class)
public class AccountIdempotencyRecord {

    @Id
    @Column(name = "tenant_id")
    private String tenantId;

    @Id
    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Column(name = "request_hash", nullable = false)
    private String requestHash;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "response_body")
    private String responseBody;

    @Column(name = "status_code", nullable = false)
    private int statusCode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getRequestHash() {
        return requestHash;
    }

    public void setRequestHash(String requestHash) {
        this.requestHash = requestHash;
    }

    public String getResponseBody() {
        return responseBody;
    }

    public void setResponseBody(String responseBody) {
        this.responseBody = responseBody;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static class Pk implements Serializable {
        private String tenantId;
        private String idempotencyKey;

        public Pk() {
        }

        public Pk(String tenantId, String idempotencyKey) {
            this.tenantId = tenantId;
            this.idempotencyKey = idempotencyKey;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Pk pk)) return false;
            return Objects.equals(tenantId, pk.tenantId) && Objects.equals(idempotencyKey, pk.idempotencyKey);
        }

        @Override
        public int hashCode() {
            return Objects.hash(tenantId, idempotencyKey);
        }
    }
}
