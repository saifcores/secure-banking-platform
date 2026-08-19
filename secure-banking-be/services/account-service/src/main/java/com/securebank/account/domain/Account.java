package com.securebank.account.domain;

import com.securebank.common.domain.account.AccountStatus;
import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import com.securebank.common.security.jpa.TenantAwareEntity;
import com.securebank.common.security.jpa.TenantHibernateFilterEnabler;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Filter(name = TenantHibernateFilterEnabler.FILTER_NAME, condition = "tenant_id = :tenantId")
public class Account extends TenantAwareEntity {

    @Id
    private UUID id;

    @Column(name = "account_number", nullable = false, unique = true)
    private String accountNumber;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "owner_user_id", nullable = false)
    private String ownerUserId;

    @Column(name = "owner_email", nullable = false)
    private String ownerEmail;

    @Column(nullable = false, length = 8)
    private String currency;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal balance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AccountStatus status;

    @Version
    private Long version;

    public Account() {
        this.id = UUID.randomUUID();
        this.balance = BigDecimal.ZERO;
        this.status = AccountStatus.ACTIVE;
    }

    public void debit(BigDecimal amount) {
        if (!status.canDebit()) {
            throw blockedOrClosed();
        }
        if (balance.compareTo(amount) < 0) {
            throw BusinessException.unprocessable(ErrorCode.INSUFFICIENT_BALANCE,
                    "Insufficient balance on source account");
        }
        this.balance = this.balance.subtract(amount);
        touch();
    }

    public void credit(BigDecimal amount) {
        if (!status.canCredit()) {
            throw blockedOrClosed();
        }
        this.balance = this.balance.add(amount);
        touch();
    }

    private BusinessException blockedOrClosed() {
        if (status == AccountStatus.BLOCKED) {
            return BusinessException.unprocessable(ErrorCode.ACCOUNT_BLOCKED, "Account is blocked");
        }
        return BusinessException.unprocessable(ErrorCode.ACCOUNT_CLOSED, "Account is closed");
    }

    public UUID getId() {
        return id;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(String ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }
}
