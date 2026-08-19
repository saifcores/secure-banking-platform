package com.securebank.common.domain.transaction;

import com.securebank.common.domain.error.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TransactionStateMachineTest {

    @Test
    void allowsCreatedToProcessing() {
        assertThat(TransactionStateMachine.transition(TransactionStatus.CREATED, TransactionStatus.PROCESSING))
                .isEqualTo(TransactionStatus.PROCESSING);
    }

    @Test
    void allowsProcessingToCompleted() {
        assertThat(TransactionStateMachine.transition(TransactionStatus.PROCESSING, TransactionStatus.COMPLETED))
                .isEqualTo(TransactionStatus.COMPLETED);
    }

    @Test
    void allowsCompletedToReversed() {
        assertThat(TransactionStateMachine.transition(TransactionStatus.COMPLETED, TransactionStatus.REVERSED))
                .isEqualTo(TransactionStatus.REVERSED);
    }

    @ParameterizedTest
    @CsvSource({
            "COMPLETED, PROCESSING",
            "FAILED, PROCESSING",
            "REVERSED, COMPLETED",
            "CREATED, COMPLETED",
            "CREATED, REVERSED",
            "PROCESSING, REVERSED",
            "FAILED, COMPLETED"
    })
    void rejectsInvalidTransitions(TransactionStatus from, TransactionStatus to) {
        assertThatThrownBy(() -> TransactionStateMachine.transition(from, to))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid transition");
    }
}
