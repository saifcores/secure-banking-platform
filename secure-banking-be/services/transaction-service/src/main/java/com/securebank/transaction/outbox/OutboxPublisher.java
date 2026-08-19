package com.securebank.transaction.outbox;

import com.securebank.transaction.domain.OutboxEvent;
import com.securebank.transaction.domain.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final OutboxEventRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public OutboxPublisher(OutboxEventRepository repository, KafkaTemplate<String, String> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelayString = "${banking.outbox.poll-interval-ms:500}")
    @Transactional
    public void publish() {
        List<OutboxEvent> pending = repository.findPendingForUpdate();
        for (OutboxEvent event : pending) {
            try {
                kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload())
                        .get(2, TimeUnit.SECONDS);
                event.markPublished();
                log.info("operation=outbox-publish status=SUCCESS eventType={} aggregateId={}",
                        event.getEventType(), event.getAggregateId());
            } catch (Exception ex) {
                log.warn("operation=outbox-publish status=FAILURE eventId={} reason={}",
                        event.getId(), ex.getMessage());
                throw new IllegalStateException("Failed to publish outbox event", ex);
            }
        }
    }
}
