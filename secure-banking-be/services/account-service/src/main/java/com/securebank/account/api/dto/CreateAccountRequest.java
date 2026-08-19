package com.securebank.account.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateAccountRequest(
        @NotNull UUID customerId,
        @NotBlank String ownerUserId,
        String ownerEmail,
        String currency,
        BigDecimal initialBalance
) {
}
