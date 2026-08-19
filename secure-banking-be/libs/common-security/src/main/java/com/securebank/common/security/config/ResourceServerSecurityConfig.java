package com.securebank.common.security.config;

import com.securebank.common.security.jwt.BankingJwtAuthenticationConverter;
import com.securebank.common.web.error.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

import java.time.Instant;

@Configuration
@EnableMethodSecurity
public class ResourceServerSecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            BankingJwtAuthenticationConverter jwtConverter,
                                            ObjectMapper objectMapper) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/actuator/prometheus",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
                        .authenticationEntryPoint((request, response, ex) ->
                                writeError(response, objectMapper, 401, "UNAUTHENTICATED",
                                        "Authentication is required"))
                        .accessDeniedHandler((request, response, ex) ->
                                writeError(response, objectMapper, 403, "ACCESS_DENIED",
                                        "You are not authorized to access this resource"))
                );
        return http.build();
    }

    private void writeError(HttpServletResponse response, ObjectMapper mapper,
                            int status, String code, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError error = new ApiError(Instant.now(), status, code, message, MDC.get("traceId"), null);
        mapper.writeValue(response.getOutputStream(), error);
    }
}
