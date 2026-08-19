package com.securebank.common.security.jpa;

public final class TenantFilterBypass implements AutoCloseable {

    private static final ThreadLocal<Boolean> ACTIVE = ThreadLocal.withInitial(() -> false);

    private TenantFilterBypass() {
        ACTIVE.set(true);
    }

    public static TenantFilterBypass open() {
        return new TenantFilterBypass();
    }

    public static boolean isActive() {
        return Boolean.TRUE.equals(ACTIVE.get());
    }

    @Override
    public void close() {
        ACTIVE.remove();
    }
}
