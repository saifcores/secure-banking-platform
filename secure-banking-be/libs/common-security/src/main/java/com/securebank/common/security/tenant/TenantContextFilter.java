package com.securebank.common.security.tenant;

import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import com.securebank.common.domain.security.CurrentPrincipal;
import com.securebank.common.domain.tenant.Tenant;
import com.securebank.common.security.principal.SecurityUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(20)
public class TenantContextFilter extends OncePerRequestFilter {

    public static final String TENANT_HEADER = "X-Tenant-Id";
    public static final String MDC_TENANT = "tenantId";
    public static final String MDC_USER = "userId";

    private static final Logger log = LoggerFactory.getLogger(TenantContextFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            CurrentPrincipal principal = SecurityUtils.currentOrNull();
            if (principal != null) {
                String tenantId = resolveTenant(principal, request);
                TenantContext.set(tenantId);
                MDC.put(MDC_TENANT, tenantId);
                MDC.put(MDC_USER, principal.userId());
            }
            filterChain.doFilter(request, response);
        } catch (BusinessException ex) {
            log.warn("Tenant isolation violation: {} path={}", ex.getMessage(), request.getRequestURI());
            throw ex;
        } finally {
            TenantContext.clear();
            MDC.remove(MDC_TENANT);
            MDC.remove(MDC_USER);
        }
    }

    private String resolveTenant(CurrentPrincipal principal, HttpServletRequest request) {
        String headerTenant = request.getHeader(TENANT_HEADER);
        if (headerTenant != null && !headerTenant.isBlank()) {
            String normalized = Tenant.normalize(headerTenant);
            if (principal.isAdmin() || principal.serviceAccount()) {
                return normalized;
            }
            if (principal.tenantId() != null && !principal.tenantId().equals(normalized)) {
                throw BusinessException.forbidden(ErrorCode.TENANT_ACCESS_DENIED,
                        "Cross-tenant access is not allowed");
            }
            return normalized;
        }
        if (principal.tenantId() != null && !principal.tenantId().isBlank()) {
            return Tenant.normalize(principal.tenantId());
        }
        if (principal.isAdmin() || principal.serviceAccount()) {
            return Tenant.PLATFORM.name();
        }
        throw BusinessException.forbidden(ErrorCode.TENANT_ACCESS_DENIED, "Tenant could not be resolved");
    }
}
