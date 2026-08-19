package com.securebank.account.domain;

import com.securebank.common.domain.account.AccountStatus;
import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountBalanceTest {

    @Test
    void debitAndCreditUpdateBalance() {
        Account account = active("1000");
        account.debit(new BigDecimal("250"));
        account.credit(new BigDecimal("50"));
        assertThat(account.getBalance()).isEqualByComparingTo("800");
    }

    @Test
    void debitRejectsInsufficientBalance() {
        Account account = active("100");
        assertThatThrownBy(() -> account.debit(new BigDecimal("150")))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(ErrorCode.INSUFFICIENT_BALANCE);
    }

    @Test
    void blockedAccountCannotDebit() {
        Account account = active("1000");
        account.setStatus(AccountStatus.BLOCKED);
        assertThatThrownBy(() -> account.debit(new BigDecimal("10")))
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(ErrorCode.ACCOUNT_BLOCKED);
    }

    private Account active(String balance) {
        Account account = new Account();
        account.setStatus(AccountStatus.ACTIVE);
        account.setBalance(new BigDecimal(balance));
        account.setCurrency("XOF");
        account.setTenantId("BANK_DAKAR");
        return account;
    }
}
