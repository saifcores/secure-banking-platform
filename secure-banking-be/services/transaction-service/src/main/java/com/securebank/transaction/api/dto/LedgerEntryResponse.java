package com.securebank.transaction.api.dto;

import com.securebank.common.domain.ledger.LedgerEntryType;

import java.math.BigDecimal;
import java.util.UUID;

public record LedgerEntryResponse(
        UUID id,
        String accountNumber,
        LedgerEntryType entryType,
        BigDecimal amount,
        String currency
) {
}
