package com.securebank.common.security.tenant;

import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import com.securebank.common.domain.security.CurrentPrincipal;
import com.securebank.common.domain.security.Role;
import com.securebank.common.security.principal.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class TenantGuard {

    private static final Logger log = LoggerFactory.getLogger(TenantGuard.class);

    public void assertSameTenant(String resourceTenantId) {
        CurrentPrincipal principal = SecurityUtils.current();
        if (principal.isAdmin() || principal.serviceAccount()) {
            return;
        }
        String current = TenantContext.get();
        if (resourceTenantId != null && resourceTenantId.equals(current)) {
            return;
        }
        log.warn("TENANT_ACCESS_DENIED user={} tenant={} resourceTenant={}",
                principal.userId(), principal.tenantId(), resourceTenantId);
        throw BusinessException.forbidden(ErrorCode.TENANT_ACCESS_DENIED,
                "You are not authorized to access this resource");
    }

    public void assertOwnedByCustomer(String resourceOwnerUserId) {
        CurrentPrincipal principal = SecurityUtils.current();
        if (principal.hasRole(Role.CUSTOMER)
                && resourceOwnerUserId != null
                && !resourceOwnerUserId.equals(principal.userId())) {
            log.warn("HORIZONTAL_ACCESS_DENIED user={}", principal.userId());
            throw BusinessException.forbidden(ErrorCode.ACCESS_DENIED,
                    "You are not authorized to access this resource");
        }
    }
}
