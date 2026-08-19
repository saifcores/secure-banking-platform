package com.securebank.account.service;

import com.securebank.common.domain.tenant.Tenant;
import com.securebank.common.security.tenant.TenantContext;

import java.security.SecureRandom;

public final class AccountNumberGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    private AccountNumberGenerator() {
    }

    public static String next() {
        Tenant tenant = Tenant.require(TenantContext.require());
        int n = RANDOM.nextInt(1_000_000);
        return tenant.getAccountPrefix() + String.format("%06d", n);
    }
}
