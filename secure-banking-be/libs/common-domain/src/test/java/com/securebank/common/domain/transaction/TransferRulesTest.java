package com.securebank.common.domain.transaction;

import com.securebank.common.domain.account.AccountStatus;
import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TransferRulesTest {

        @Test
        void rejectsCrossTenantTransfer() {
                assertThatThrownBy(() -> TransferRules.validate(
                                "DK0001", "AB0001",
                                "BANK_DAKAR", "BANK_ABIDJAN",
                                AccountStatus.ACTIVE, AccountStatus.ACTIVE,
                                new BigDecimal("1000"), new BigDecimal("100"),
                                "XOF", "XOF", "XOF")).isInstanceOf(BusinessException.class)
                                .extracting(ex -> ((BusinessException) ex).getCode())
                                .isEqualTo(ErrorCode.TENANT_ACCESS_DENIED);
        }

        @Test
        void rejectsInsufficientBalance() {
                assertThatThrownBy(() -> TransferRules.validate(
                                "DK0001", "DK0002",
                                "BANK_DAKAR", "BANK_DAKAR",
                                AccountStatus.ACTIVE, AccountStatus.ACTIVE,
                                new BigDecimal("50"), new BigDecimal("100"),
                                "XOF", "XOF", "XOF")).extracting(ex -> ((BusinessException) ex).getCode())
                                .isEqualTo(ErrorCode.INSUFFICIENT_BALANCE);
        }

        @Test
        void rejectsBlockedAccount() {
                assertThatThrownBy(() -> TransferRules.validate(
                                "DK0001", "DK0002",
                                "BANK_DAKAR", "BANK_DAKAR",
                                AccountStatus.BLOCKED, AccountStatus.ACTIVE,
                                new BigDecimal("500"), new BigDecimal("100"),
                                "XOF", "XOF", "XOF")).extracting(ex -> ((BusinessException) ex).getCode())
                                .isEqualTo(ErrorCode.ACCOUNT_BLOCKED);
        }
}
