package com.securebank.common.domain.security;

import java.util.Set;

public record CurrentPrincipal(
        String userId,
        String username,
        String tenantId,
        Set<Role> roles,
        Set<Permission> permissions,
        boolean serviceAccount) {
    public boolean hasPermission(Permission permission) {
        return permissions.contains(permission) || permissions.contains(Permission.ADMIN);
    }

    public boolean hasRole(Role role) {
        return roles.contains(role);
    }

    public boolean isAdmin() {
        return roles.contains(Role.ADMIN);
    }

    public boolean isPlatformAdmin() {
        return isAdmin() && ("PLATFORM".equals(tenantId) || tenantId == null);
    }

    public boolean canAccessTenant(String resourceTenantId) {
        if (isAdmin() || serviceAccount) {
            return true;
        }
        return tenantId != null && tenantId.equals(resourceTenantId);
    }
}
