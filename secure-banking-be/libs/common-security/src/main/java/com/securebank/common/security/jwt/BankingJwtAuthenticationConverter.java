package com.securebank.common.security.jwt;

import com.securebank.common.domain.security.CurrentPrincipal;
import com.securebank.common.domain.security.Permission;
import com.securebank.common.domain.security.Role;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class BankingJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    public static final String TENANT_CLAIM = "tenant_id";

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        CurrentPrincipal principal = principalFrom(jwt);
        Set<GrantedAuthority> authorities = Stream.concat(
                        principal.roles().stream().map(role -> "ROLE_" + role.name()),
                        principal.permissions().stream().map(Permission::getValue)
                )
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
        return new BankingAuthenticationToken(jwt, authorities, principal);
    }

    public static CurrentPrincipal principalFrom(Jwt jwt) {
        Set<Role> roles = extractRoles(jwt);
        Set<Permission> permissions = Role.resolvePermissions(roles);
        String username = jwt.getClaimAsString("preferred_username");
        boolean serviceAccount = roles.contains(Role.SERVICE)
                || Boolean.TRUE.equals(jwt.getClaim("service_account"))
                || (username != null && username.startsWith("service-account-"));
        return new CurrentPrincipal(
                jwt.getSubject(),
                firstNonBlank(username, jwt.getClaimAsString("azp"), jwt.getSubject()),
                jwt.getClaimAsString(TENANT_CLAIM),
                roles,
                permissions,
                serviceAccount
        );
    }

    @SuppressWarnings("unchecked")
    static Set<Role> extractRoles(Jwt jwt) {
        Set<String> raw = new HashSet<>();
        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> map) {
            Object roles = map.get("roles");
            if (roles instanceof Collection<?> collection) {
                collection.forEach(role -> raw.add(String.valueOf(role)));
            }
        }
        List<String> direct = jwt.getClaimAsStringList("roles");
        if (direct != null) {
            raw.addAll(direct);
        }
        return raw.stream()
                .map(Role::fromClaim)
                .flatMap(java.util.Optional::stream)
                .collect(Collectors.toUnmodifiableSet());
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    public static final class BankingAuthenticationToken extends JwtAuthenticationToken {
        private final CurrentPrincipal principal;

        public BankingAuthenticationToken(Jwt jwt, Collection<? extends GrantedAuthority> authorities,
                                          CurrentPrincipal principal) {
            super(jwt, authorities, principal.username());
            this.principal = principal;
            setDetails(principal);
        }

        public CurrentPrincipal getBankingPrincipal() {
            return principal;
        }
    }
}
