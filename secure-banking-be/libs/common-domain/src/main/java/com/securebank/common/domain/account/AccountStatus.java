package com.securebank.common.domain.account;

public enum AccountStatus {
    ACTIVE,
    BLOCKED,
    CLOSED;

    public boolean canDebit() {
        return this == ACTIVE;
    }

    public boolean canCredit() {
        return this == ACTIVE;
    }

    public boolean isOperable() {
        return this == ACTIVE;
    }
}
