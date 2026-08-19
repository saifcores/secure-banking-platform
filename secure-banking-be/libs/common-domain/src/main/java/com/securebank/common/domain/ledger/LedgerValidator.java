package com.securebank.common.domain.ledger;

import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;

import java.math.BigDecimal;
import java.util.List;

public final class LedgerValidator {

    private LedgerValidator() {
    }

    public static void requireBalanced(List<LedgerPosting> postings) {
        if (!LedgerPosting.isBalanced(postings)) {
            throw BusinessException.unprocessable(ErrorCode.LEDGER_IMBALANCE,
                    "Total debits must equal total credits");
        }
    }

    public static void requirePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw BusinessException.badRequest(ErrorCode.INVALID_TRANSACTION,
                    "Amount must be greater than zero");
        }
    }
}
