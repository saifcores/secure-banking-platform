package com.securebank.common.security.jwt;

import com.securebank.common.domain.security.Permission;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class BankingJwtAuthenticationConverterTest {

    private final BankingJwtAuthenticationConverter converter = new BankingJwtAuthenticationConverter();

    @Test
    void mapsOperatorRoleToAccountCreatePermission() {
        Jwt jwt = jwtWithRole("OPERATOR", "BANK_DAKAR");
        var token = (BankingJwtAuthenticationConverter.BankingAuthenticationToken) converter.convert(jwt);
        assertThat(token.getBankingPrincipal().tenantId()).isEqualTo("BANK_DAKAR");
        assertThat(token.getAuthorities().stream().map(GrantedAuthority::getAuthority))
                .contains("ROLE_OPERATOR", Permission.ACCOUNT_CREATE.getValue(), Permission.TRANSACTION_CANCEL.getValue());
    }

    @Test
    void customerDoesNotReceiveAuditPermission() {
        Jwt jwt = jwtWithRole("CUSTOMER", "BANK_ABIDJAN");
        var token = (BankingJwtAuthenticationConverter.BankingAuthenticationToken) converter.convert(jwt);
        assertThat(token.getAuthorities().stream().map(GrantedAuthority::getAuthority))
                .contains(Permission.TRANSACTION_CREATE.getValue())
                .doesNotContain(Permission.AUDIT_READ.getValue(), Permission.ACCOUNT_CREATE.getValue());
    }

    private Jwt jwtWithRole(String role, String tenant) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("user-1")
                .claim("preferred_username", "user1")
                .claim("tenant_id", tenant)
                .claim("realm_access", Map.of("roles", List.of(role)))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
    }
}
