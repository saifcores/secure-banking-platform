package com.securebank.common.domain.transaction;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Financial transaction lifecycle. Invalid transitions are rejected.
 *
 * <pre>
 * CREATED → PROCESSING → COMPLETED → REVERSED
 *                ↘ FAILED
 * CREATED → FAILED
 * </pre>
 */
public enum TransactionStatus {
    CREATED,
    PROCESSING,
    FAILED,
    COMPLETED,
    REVERSED;

    private static final Map<TransactionStatus, Set<TransactionStatus>> ALLOWED = allowed();

    private static Map<TransactionStatus, Set<TransactionStatus>> allowed() {
        Map<TransactionStatus, Set<TransactionStatus>> map = new EnumMap<>(TransactionStatus.class);
        map.put(CREATED, EnumSet.of(PROCESSING, FAILED));
        map.put(PROCESSING, EnumSet.of(COMPLETED, FAILED));
        map.put(COMPLETED, EnumSet.of(REVERSED));
        map.put(FAILED, EnumSet.noneOf(TransactionStatus.class));
        map.put(REVERSED, EnumSet.noneOf(TransactionStatus.class));
        return Collections.unmodifiableMap(map);
    }

    public boolean canTransitionTo(TransactionStatus target) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(target);
    }

    public Set<TransactionStatus> allowedTargets() {
        return ALLOWED.getOrDefault(this, Set.of());
    }
}
