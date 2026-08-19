package com.securebank.transaction.client;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountTransferResponse(
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
