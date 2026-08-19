package com.securebank.gateway.fallback;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping({"/{service}", "/{service}/**"})
    public Mono<Map<String, Object>> getFallback(ServerWebExchange exchange) {
        return fallback(exchange);
    }

    @PostMapping({"/{service}", "/{service}/**"})
    public Mono<Map<String, Object>> postFallback(ServerWebExchange exchange) {
        return fallback(exchange);
    }

    private Mono<Map<String, Object>> fallback(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        return Mono.just(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 503,
                "code", "INTERNAL_ERROR",
                "message", "Upstream service is temporarily unavailable",
                "traceId", exchange.getRequest().getHeaders().getFirst("X-Correlation-Id")
        ));
    }
}
