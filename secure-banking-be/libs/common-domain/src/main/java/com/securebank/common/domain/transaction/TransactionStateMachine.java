package com.securebank.common.domain.transaction;

import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;

public final class TransactionStateMachine {

    private TransactionStateMachine() {
    }

    public static TransactionStatus transition(TransactionStatus from, TransactionStatus to) {
        if (from == null || to == null) {
            throw BusinessException.unprocessable(ErrorCode.INVALID_STATE_TRANSITION,
                    "Transaction status cannot be null");
        }
        if (!from.canTransitionTo(to)) {
            throw BusinessException.unprocessable(ErrorCode.INVALID_STATE_TRANSITION,
                    "Invalid transition: " + from + " → " + to);
        }
        return to;
    }
}
