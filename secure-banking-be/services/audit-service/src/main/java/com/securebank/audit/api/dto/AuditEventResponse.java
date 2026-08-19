package com.securebank.audit.api.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditEventResponse(
        UUID id,
        String tenantId,
        String eventType,
        String aggregateType,
        String aggregateId,
        String actorId,
        String action,
        String status,
        String payload,
        String traceId,
        Instant createdAt
) {
}
