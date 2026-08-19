package com.securebank.transaction.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class TransactionMetrics {

    private final Counter success;
    private final Counter failure;

    public TransactionMetrics(MeterRegistry registry) {
        this.success = Counter.builder("transaction_success_total")
                .description("Completed financial transfers")
                .register(registry);
        this.failure = Counter.builder("transaction_failure_total")
                .description("Failed financial transfers")
                .register(registry);
    }

    public void success() {
        success.increment();
    }

    public void failure() {
        failure.increment();
    }
}
