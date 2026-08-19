package com.securebank.account.api;

import com.securebank.account.AccountServiceApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = AccountServiceApplication.class)
@AutoConfigureMockMvc
@Testcontainers
class AccountTenantIsolationIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", () -> "http://localhost:9999/realms/banking");
        registry.add("management.otlp.tracing.endpoint", () -> "http://localhost:4318/v1/traces");
        registry.add("management.tracing.sampling.probability", () -> "0.0");
    }

    @Autowired
    MockMvc mockMvc;

    @MockBean
    JwtDecoder jwtDecoder;

    @Test
    void dakarCustomerCannotReadAbidjanAccount() throws Exception {
        mockMvc.perform(get("/api/v1/accounts/{id}", "bbbb1111-1111-1111-1111-111111111111")
                        .with(jwt().jwt(builder -> builder
                                        .subject("user-dakar")
                                        .claim("preferred_username", "awa.diop")
                                        .claim("email", "awa.diop@bank-dakar.local")
                                        .claim("tenant_id", "BANK_DAKAR")
                                        .claim("realm_access", java.util.Map.of("roles", java.util.List.of("CUSTOMER"))))
                                .authorities(
                                        new SimpleGrantedAuthority("account:read"),
                                        new SimpleGrantedAuthority("ROLE_CUSTOMER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("TENANT_ACCESS_DENIED"));
    }

    @Test
    void dakarCustomerCanListOwnTenantAccounts() throws Exception {
        mockMvc.perform(get("/api/v1/accounts")
                        .with(jwt().jwt(builder -> builder
                                        .subject("user-dakar")
                                        .claim("preferred_username", "awa.diop")
                                        .claim("email", "awa.diop@bank-dakar.local")
                                        .claim("tenant_id", "BANK_DAKAR")
                                        .claim("realm_access", java.util.Map.of("roles", java.util.List.of("CUSTOMER"))))
                                .authorities(
                                        new SimpleGrantedAuthority("account:read"),
                                        new SimpleGrantedAuthority("ROLE_CUSTOMER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
