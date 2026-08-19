package com.securebank.common.domain.transaction;

import com.securebank.common.domain.account.AccountStatus;
import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;

import java.math.BigDecimal;
import java.util.Objects;

public final class TransferRules {

    private TransferRules() {
    }

    public static void validate(
            String sourceAccount,
            String destinationAccount,
            String sourceTenant,
            String destinationTenant,
            AccountStatus sourceStatus,
            AccountStatus destinationStatus,
            BigDecimal sourceBalance,
            BigDecimal amount,
            String sourceCurrency,
            String destinationCurrency,
            String requestCurrency) {
        if (sourceAccount == null || destinationAccount == null
                || Objects.equals(sourceAccount, destinationAccount)) {
            throw BusinessException.badRequest(ErrorCode.INVALID_TRANSACTION,
                    "Source and destination accounts must be different");
        }
        if (!Objects.equals(sourceTenant, destinationTenant)) {
            throw BusinessException.forbidden(ErrorCode.TENANT_ACCESS_DENIED,
                    "Cross-tenant transfers are not allowed");
        }
        if (sourceStatus == AccountStatus.BLOCKED || destinationStatus == AccountStatus.BLOCKED) {
            throw BusinessException.unprocessable(ErrorCode.ACCOUNT_BLOCKED,
                    "One of the accounts is blocked");
        }
        if (sourceStatus == AccountStatus.CLOSED || destinationStatus == AccountStatus.CLOSED) {
            throw BusinessException.unprocessable(ErrorCode.ACCOUNT_CLOSED,
                    "One of the accounts is closed");
        }
        if (!sourceStatus.canDebit() || !destinationStatus.canCredit()) {
            throw BusinessException.unprocessable(ErrorCode.INVALID_TRANSACTION,
                    "Accounts are not operable");
        }
        if (!Objects.equals(sourceCurrency, destinationCurrency)
                || !Objects.equals(sourceCurrency, requestCurrency)) {
            throw BusinessException.badRequest(ErrorCode.CURRENCY_MISMATCH,
                    "Currency mismatch between accounts and request");
        }
        if (amount == null || amount.signum() <= 0) {
            throw BusinessException.badRequest(ErrorCode.INVALID_TRANSACTION,
                    "Amount must be greater than zero");
        }
        if (sourceBalance == null || sourceBalance.compareTo(amount) < 0) {
            throw BusinessException.unprocessable(ErrorCode.INSUFFICIENT_BALANCE,
                    "Insufficient balance on source account");
        }
    }
}
