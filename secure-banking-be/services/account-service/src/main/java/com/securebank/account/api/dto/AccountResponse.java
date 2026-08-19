package com.securebank.account.api.dto;

import com.securebank.common.domain.account.AccountStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AccountResponse(
        UUID id,
        String accountNumber,
        UUID customerId,
        String tenantId,
        String currency,
        BigDecimal balance,
        AccountStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
