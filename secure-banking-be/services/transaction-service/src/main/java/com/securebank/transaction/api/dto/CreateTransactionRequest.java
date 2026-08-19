package com.securebank.transaction.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateTransactionRequest(
        @NotBlank String sourceAccount,
        @NotBlank String destinationAccount,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String currency
) {
}
