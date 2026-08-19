package com.securebank.common.web.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
public class RequestMetricsFilter extends OncePerRequestFilter {

    private final Counter requestsTotal;
    private final Timer requestDuration;

    public RequestMetricsFilter(MeterRegistry registry) {
        this.requestsTotal = Counter.builder("requests_total")
                .description("Total HTTP requests")
                .register(registry);
        this.requestDuration = Timer.builder("request_duration")
                .description("HTTP request duration")
                .register(registry);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        long start = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            requestsTotal.increment();
            requestDuration.record(Duration.ofNanos(System.nanoTime() - start));
        }
    }
}
