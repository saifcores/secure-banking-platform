package com.securebank.common.security.principal;

import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import com.securebank.common.domain.security.CurrentPrincipal;
import com.securebank.common.security.jwt.BankingJwtAuthenticationConverter;
import com.securebank.common.security.jwt.BankingJwtAuthenticationConverter.BankingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static CurrentPrincipal current() {
        CurrentPrincipal principal = currentOrNull();
        if (principal == null) {
            throw BusinessException.forbidden(ErrorCode.UNAUTHENTICATED, "Authenticated principal is required");
        }
        return principal;
    }

    public static CurrentPrincipal currentOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof BankingAuthenticationToken token) {
            return token.getBankingPrincipal();
        }
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            return BankingJwtAuthenticationConverter.principalFrom(jwtAuth.getToken());
        }
        return null;
    }
}
