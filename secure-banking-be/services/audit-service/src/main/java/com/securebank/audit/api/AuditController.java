package com.securebank.audit.api;

import com.securebank.audit.api.dto.AuditEventResponse;
import com.securebank.audit.domain.AuditEvent;
import com.securebank.audit.domain.AuditEventRepository;
import com.securebank.common.security.tenant.TenantGuard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Audit")
@SecurityRequirement(name = "bearer-jwt")
public class AuditController {

    private final AuditEventRepository repository;
    private final TenantGuard tenantGuard;

    public AuditController(AuditEventRepository repository, TenantGuard tenantGuard) {
        this.repository = repository;
        this.tenantGuard = tenantGuard;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('audit:read')")
    @Operation(summary = "List audit events for the current tenant")
    public Page<AuditEventResponse> list(@RequestParam(required = false) String eventType, Pageable pageable) {
        Page<AuditEvent> page = eventType == null || eventType.isBlank()
                ? repository.findAll(pageable)
                : repository.findByEventType(eventType, pageable);
        return page.map(this::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('audit:read')")
    @Operation(summary = "Get an audit event by id")
    public AuditEventResponse get(@PathVariable UUID id) {
        AuditEvent event = repository.findById(id).orElseThrow();
        tenantGuard.assertSameTenant(event.getTenantId());
        return toResponse(event);
    }

    private AuditEventResponse toResponse(AuditEvent event) {
        return new AuditEventResponse(
                event.getId(),
                event.getTenantId(),
                event.getEventType(),
                event.getAggregateType(),
                event.getAggregateId(),
                event.getActorId(),
                event.getAction(),
                event.getStatus(),
                event.getPayload(),
                event.getTraceId(),
                event.getCreatedAt()
        );
    }
}
