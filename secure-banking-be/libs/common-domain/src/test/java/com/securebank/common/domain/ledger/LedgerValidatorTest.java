package com.securebank.common.domain.ledger;

import com.securebank.common.domain.error.BusinessException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LedgerValidatorTest {

    @Test
    void transferPostingIsBalanced() {
        List<LedgerPosting> postings = List.of(
                LedgerPosting.debit(new BigDecimal("150000"), "XOF"),
                LedgerPosting.credit(new BigDecimal("150000"), "XOF"));
        assertThat(LedgerPosting.isBalanced(postings)).isTrue();
        LedgerValidator.requireBalanced(postings);
    }

    @Test
    void rejectsUnbalancedPosting() {
        List<LedgerPosting> postings = List.of(
                LedgerPosting.debit(new BigDecimal("150000"), "XOF"),
                LedgerPosting.credit(new BigDecimal("100000"), "XOF"));
        assertThatThrownBy(() -> LedgerValidator.requireBalanced(postings))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void rejectsSingleSidedPosting() {
        assertThat(LedgerPosting.isBalanced(List.of(
                LedgerPosting.debit(new BigDecimal("10"), "XOF")))).isFalse();
    }
}
