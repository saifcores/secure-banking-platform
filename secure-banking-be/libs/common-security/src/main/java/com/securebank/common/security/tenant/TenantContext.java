package com.securebank.common.security.tenant;

public final class TenantContext {

    private static final ThreadLocal<String> TENANT = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(String tenantId) {
        TENANT.set(tenantId);
    }

    public static String get() {
        return TENANT.get();
    }

    public static String require() {
        String tenantId = TENANT.get();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("No tenant bound to the current request");
        }
        return tenantId;
    }

    public static void clear() {
        TENANT.remove();
    }
}
