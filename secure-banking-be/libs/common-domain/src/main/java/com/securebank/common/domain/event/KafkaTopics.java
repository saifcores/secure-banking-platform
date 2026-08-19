package com.securebank.common.domain.event;

public final class KafkaTopics {

    public static final String TRANSACTION_EVENTS = "banking.transaction.events";
    public static final String AUDIT_EVENTS = "banking.audit.events";
    public static final String SECURITY_EVENTS = "banking.security.events";

    private KafkaTopics() {
    }
}
