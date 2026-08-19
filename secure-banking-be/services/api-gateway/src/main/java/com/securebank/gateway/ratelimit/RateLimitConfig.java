package com.securebank.gateway.ratelimit;

import org.springframework.context.annotation.Profile;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
@Profile("!no-redis")
public class RateLimitConfig {

    @Bean
    RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(30, 60);
    }

    @Bean
    KeyResolver principalKeyResolver() {
        return exchange -> exchange.getPrincipal()
                .map(principal -> principal.getName())
                .switchIfEmpty(Mono.just(exchange.getRequest().getRemoteAddress() == null
                        ? "anonymous"
                        : exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()));
    }
}
