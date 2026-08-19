package com.securebank.gateway.filter;

import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Configuration
public class CorrelationIdConfig {

    public static final String HEADER = "X-Correlation-Id";

    @Bean
    GlobalFilter correlationIdFilter() {
        return (exchange, chain) -> {
            String correlationId = exchange.getRequest().getHeaders().getFirst(HEADER);
            if (correlationId == null || correlationId.isBlank()) {
                correlationId = UUID.randomUUID().toString();
            }
            String cid = correlationId;
            var mutated = exchange.getRequest().mutate()
                    .header(HEADER, cid)
                    .build();
            exchange.getResponse().getHeaders().set(HEADER, cid);
            MDC.put("correlationId", cid);
            String tenant = exchange.getRequest().getHeaders().getFirst("X-Tenant-Id");
            if (tenant != null) {
                MDC.put("tenantId", tenant);
            }
            return chain.filter(exchange.mutate().request(mutated).build())
                    .doFinally(signal -> {
                        MDC.remove("correlationId");
                        MDC.remove("tenantId");
                    });
        };
    }

    @Bean
    Ordered correlationOrder() {
        return () -> Ordered.HIGHEST_PRECEDENCE;
    }
}
