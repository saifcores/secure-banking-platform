package com.securebank.account.api.dto;

import com.securebank.common.domain.account.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAccountRequest(@NotNull AccountStatus status) {
}
