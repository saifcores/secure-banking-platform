package com.securebank.common.domain.security;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public enum Role {
    CUSTOMER,
    OPERATOR,
    SUPPORT,
    AUDITOR,
    ADMIN,
    SERVICE;

    private static final Map<Role, Set<Permission>> MATRIX = buildMatrix();

    private static Map<Role, Set<Permission>> buildMatrix() {
        Map<Role, Set<Permission>> matrix = new EnumMap<>(Role.class);
        matrix.put(CUSTOMER, EnumSet.of(
                Permission.ACCOUNT_READ,
                Permission.TRANSACTION_READ,
                Permission.TRANSACTION_CREATE,
                Permission.CUSTOMER_READ));
        matrix.put(OPERATOR, EnumSet.of(
                Permission.ACCOUNT_READ,
                Permission.ACCOUNT_CREATE,
                Permission.ACCOUNT_UPDATE,
                Permission.TRANSACTION_READ,
                Permission.TRANSACTION_CREATE,
                Permission.TRANSACTION_CANCEL,
                Permission.CUSTOMER_READ,
                Permission.CUSTOMER_UPDATE));
        matrix.put(SUPPORT, EnumSet.of(
                Permission.ACCOUNT_READ,
                Permission.TRANSACTION_READ,
                Permission.CUSTOMER_READ));
        matrix.put(AUDITOR, EnumSet.of(Permission.AUDIT_READ));
        matrix.put(ADMIN, EnumSet.allOf(Permission.class));
        matrix.put(SERVICE, EnumSet.of(
                Permission.ACCOUNT_READ,
                Permission.ACCOUNT_UPDATE,
                Permission.TRANSACTION_READ,
                Permission.CUSTOMER_READ));
        return Collections.unmodifiableMap(matrix);
    }

    public Set<Permission> permissions() {
        return MATRIX.getOrDefault(this, Set.of());
    }

    public static Optional<Role> fromClaim(String claim) {
        if (claim == null || claim.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(Role.valueOf(claim.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public static Set<Permission> resolvePermissions(Set<Role> roles) {
        return roles.stream()
                .flatMap(role -> role.permissions().stream())
                .collect(Collectors.toUnmodifiableSet());
    }
}
