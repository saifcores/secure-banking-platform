package com.securebank.account.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountIdempotencyRepository extends JpaRepository<AccountIdempotencyRecord, AccountIdempotencyRecord.Pk> {

    Optional<AccountIdempotencyRecord> findByTenantIdAndIdempotencyKey(String tenantId, String idempotencyKey);
}
