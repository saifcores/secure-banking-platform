package com.securebank.transaction.config;

import com.securebank.common.domain.event.KafkaTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    NewTopic transactionEvents() {
        return TopicBuilder.name(KafkaTopics.TRANSACTION_EVENTS).partitions(3).replicas(1).build();
    }

    @Bean
    NewTopic auditEvents() {
        return TopicBuilder.name(KafkaTopics.AUDIT_EVENTS).partitions(3).replicas(1).build();
    }

    @Bean
    NewTopic securityEvents() {
        return TopicBuilder.name(KafkaTopics.SECURITY_EVENTS).partitions(3).replicas(1).build();
    }
}
