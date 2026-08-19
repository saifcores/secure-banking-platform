package com.securebank.transaction.api.dto;

import com.securebank.common.domain.transaction.TransactionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        String reference,
        String tenantId,
        String sourceAccount,
        String destinationAccount,
        BigDecimal amount,
        String currency,
        TransactionStatus status,
        String failureReason,
        List<LedgerEntryResponse> ledgerEntries,
        Instant createdAt,
        Instant updatedAt
) {
}
