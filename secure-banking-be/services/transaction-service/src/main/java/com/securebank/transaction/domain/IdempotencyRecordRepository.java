package com.securebank.transaction.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, IdempotencyRecord.Pk> {
    Optional<IdempotencyRecord> findByTenantIdAndIdempotencyKey(String tenantId, String idempotencyKey);
}
