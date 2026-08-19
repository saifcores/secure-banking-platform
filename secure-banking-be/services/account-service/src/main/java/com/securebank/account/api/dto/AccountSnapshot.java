package com.securebank.account.api.dto;

import com.securebank.common.domain.account.AccountStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountSnapshot(
        UUID id,
        String accountNumber,
        UUID customerId,
        String ownerUserId,
        String tenantId,
        String currency,
        BigDecimal balance,
        AccountStatus status
) {
}
