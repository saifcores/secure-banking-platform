package com.securebank.common.web.error;

import java.time.Instant;

public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String message,
        String traceId,
        String path
) {
}
