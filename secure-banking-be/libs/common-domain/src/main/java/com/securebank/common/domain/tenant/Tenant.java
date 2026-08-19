package com.securebank.common.domain.tenant;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum Tenant {
    BANK_DAKAR("DK", "XOF"),
    BANK_ABIDJAN("AB", "XOF"),
    BANK_BAMAKO("BM", "XOF"),
    PLATFORM("PL", "XOF");

    private final String accountPrefix;
    private final String defaultCurrency;

    Tenant(String accountPrefix, String defaultCurrency) {
        this.accountPrefix = accountPrefix;
        this.defaultCurrency = defaultCurrency;
    }

    public String getAccountPrefix() {
        return accountPrefix;
    }

    public String getDefaultCurrency() {
        return defaultCurrency;
    }

    public boolean isPlatform() {
        return this == PLATFORM;
    }

    public static Optional<Tenant> fromId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(t -> t.name().equalsIgnoreCase(tenantId.trim()))
                .findFirst();
    }

    public static Tenant require(String tenantId) {
        return fromId(tenantId).orElseThrow(() -> new IllegalArgumentException("Unknown tenant: " + tenantId));
    }

    public static String normalize(String tenantId) {
        return require(tenantId).name();
    }

    public static boolean isKnown(String tenantId) {
        return fromId(tenantId).isPresent();
    }

    public static String toUpper(String tenantId) {
        return tenantId == null ? null : tenantId.trim().toUpperCase(Locale.ROOT);
    }
}
