package com.securebank.common.domain.event;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record DomainEvent(
                String eventId,
                String eventType,
                String tenantId,
                String aggregateType,
                String aggregateId,
                Instant occurredAt,
                String traceId,
                Map<String, Object> payload) {
        public static DomainEvent of(String eventType, String tenantId, String aggregateType,
                        String aggregateId, String traceId, Map<String, Object> payload) {
                return new DomainEvent(
                                UUID.randomUUID().toString(),
                                eventType,
                                tenantId,
                                aggregateType,
                                aggregateId,
                                Instant.now(),
                                traceId,
                                payload);
        }
}
