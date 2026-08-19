package com.securebank.account.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record InternalTransferResponse(
        UUID sourceAccountId,
        UUID destinationAccountId,
        String sourceAccount,
        String destinationAccount,
        String tenantId,
        BigDecimal sourceBalance,
        BigDecimal destinationBalance,
        String currency
) {
}
