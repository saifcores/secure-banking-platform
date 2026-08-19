package com.securebank.transaction.domain;

import com.securebank.common.domain.ledger.LedgerEntryType;
import com.securebank.common.security.jpa.TenantAwareEntity;
import com.securebank.common.security.jpa.TenantHibernateFilterEnabler;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries")
@Filter(name = TenantHibernateFilterEnabler.FILTER_NAME, condition = "tenant_id = :tenantId")
public class LedgerEntry extends TenantAwareEntity {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "transaction_id", nullable = false)
    private UUID transactionId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 16)
    private LedgerEntryType entryType;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 8)
    private String currency;

    public static LedgerEntry of(UUID transactionId, UUID accountId, String accountNumber,
                                 LedgerEntryType type, BigDecimal amount, String currency, String tenantId) {
        LedgerEntry entry = new LedgerEntry();
        entry.transactionId = transactionId;
        entry.accountId = accountId;
        entry.accountNumber = accountNumber;
        entry.entryType = type;
        entry.amount = amount;
        entry.currency = currency;
        entry.setTenantId(tenantId);
        return entry;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTransactionId() {
        return transactionId;
    }

    public UUID getAccountId() {
        return accountId;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public LedgerEntryType getEntryType() {
        return entryType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }
}
