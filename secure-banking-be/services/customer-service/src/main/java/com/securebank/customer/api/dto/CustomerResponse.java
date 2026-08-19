package com.securebank.customer.api.dto;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String tenantId,
        String keycloakUserId,
        String firstName,
        String lastName,
        String email,
        String phone,
        String status,
        Instant createdAt,
        Instant updatedAt
) {
}
