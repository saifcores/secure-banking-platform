package com.securebank.common.domain.security;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Fine-grained permissions mapped from Keycloak realm roles.
 */
public enum Permission {
    ACCOUNT_READ("account:read"),
    ACCOUNT_CREATE("account:create"),
    ACCOUNT_UPDATE("account:update"),
    TRANSACTION_READ("transaction:read"),
    TRANSACTION_CREATE("transaction:create"),
    TRANSACTION_CANCEL("transaction:cancel"),
    CUSTOMER_READ("customer:read"),
    CUSTOMER_UPDATE("customer:update"),
    AUDIT_READ("audit:read"),
    ADMIN("admin");

    private final String value;

    Permission(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Permission fromValue(String value) {
        for (Permission permission : values()) {
            if (permission.value.equals(value)) {
                return permission;
            }
        }
        throw new IllegalArgumentException("Unknown permission: " + value);
    }
}
