package com.securebank.audit.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securebank.audit.domain.AuditEvent;
import com.securebank.audit.domain.AuditEventRepository;
import com.securebank.common.domain.event.KafkaTopics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TransactionEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(TransactionEventConsumer.class);

    private final AuditEventRepository repository;
    private final ObjectMapper objectMapper;

    public TransactionEventConsumer(AuditEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = KafkaTopics.TRANSACTION_EVENTS)
    @Transactional
    public void onTransactionEvent(String payload) {
        persist("TRANSACTION", payload);
    }

    @KafkaListener(topics = KafkaTopics.SECURITY_EVENTS)
    @Transactional
    public void onSecurityEvent(String payload) {
        persist("SECURITY", payload);
    }

    private void persist(String category, String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            AuditEvent event = new AuditEvent();
            event.setTenantId(text(node, "tenantId"));
            event.setEventType(text(node, "eventType"));
            event.setAggregateType(text(node, "aggregateType") != null ? text(node, "aggregateType") : category);
            event.setAggregateId(first(node, "aggregateId", "transactionId", "reference"));
            event.setActorId(first(node, "initiatedBy", "actorId", "userId"));
            event.setAction(text(node, "eventType") == null ? category : text(node, "eventType"));
            event.setStatus(text(node, "status") == null ? "RECORDED" : text(node, "status"));
            event.setTraceId(text(node, "traceId"));
            event.setPayload(payload);
            repository.save(event);
            log.info("operation=audit-ingest status=SUCCESS eventType={} tenant={}",
                    event.getEventType(), event.getTenantId());
        } catch (Exception ex) {
            log.error("operation=audit-ingest status=FAILURE payload={}", payload, ex);
            throw new IllegalStateException("Failed to persist audit event", ex);
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static String first(JsonNode node, String... fields) {
        for (String field : fields) {
            String value = text(node, field);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
