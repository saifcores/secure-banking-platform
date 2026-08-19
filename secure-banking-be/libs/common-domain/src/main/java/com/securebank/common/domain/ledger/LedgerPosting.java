package com.securebank.common.domain.ledger;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Double-entry invariant: for a valid posting, total debits must equal total
 * credits.
 */
public record LedgerPosting(BigDecimal amount, String currency, LedgerEntryType type) {

    public LedgerPosting {
        Objects.requireNonNull(amount, "amount");
        Objects.requireNonNull(currency, "currency");
        Objects.requireNonNull(type, "type");
        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("Ledger amount must be positive");
        }
    }

    public static LedgerPosting debit(BigDecimal amount, String currency) {
        return new LedgerPosting(amount, currency, LedgerEntryType.DEBIT);
    }

    public static LedgerPosting credit(BigDecimal amount, String currency) {
        return new LedgerPosting(amount, currency, LedgerEntryType.CREDIT);
    }

    public static boolean isBalanced(List<LedgerPosting> postings) {
        if (postings == null || postings.size() < 2) {
            return false;
        }
        String currency = postings.getFirst().currency();
        BigDecimal debits = BigDecimal.ZERO;
        BigDecimal credits = BigDecimal.ZERO;
        for (LedgerPosting posting : postings) {
            if (!currency.equals(posting.currency())) {
                return false;
            }
            if (posting.type() == LedgerEntryType.DEBIT) {
                debits = debits.add(posting.amount());
            } else {
                credits = credits.add(posting.amount());
            }
        }
        return debits.compareTo(credits) == 0 && debits.signum() > 0;
    }
}
