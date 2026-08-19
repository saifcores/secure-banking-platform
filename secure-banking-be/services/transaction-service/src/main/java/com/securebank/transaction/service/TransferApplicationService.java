package com.securebank.transaction.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import com.securebank.common.domain.event.KafkaTopics;
import com.securebank.common.domain.ledger.LedgerEntryType;
import com.securebank.common.domain.ledger.LedgerPosting;
import com.securebank.common.domain.ledger.LedgerValidator;
import com.securebank.common.domain.security.CurrentPrincipal;
import com.securebank.common.domain.security.Role;
import com.securebank.common.domain.transaction.TransactionStatus;
import com.securebank.common.domain.transaction.TransferRules;
import com.securebank.common.security.principal.SecurityUtils;
import com.securebank.common.security.tenant.TenantContext;
import com.securebank.common.security.tenant.TenantGuard;
import com.securebank.transaction.api.dto.CreateTransactionRequest;
import com.securebank.transaction.api.dto.LedgerEntryResponse;
import com.securebank.transaction.api.dto.TransactionResponse;
import com.securebank.transaction.client.AccountClient;
import com.securebank.transaction.client.AccountSnapshot;
import com.securebank.transaction.client.AccountTransferResponse;
import com.securebank.transaction.domain.BankingTransaction;
import com.securebank.transaction.domain.BankingTransactionRepository;
import com.securebank.transaction.domain.IdempotencyRecord;
import com.securebank.transaction.domain.IdempotencyRecordRepository;
import com.securebank.transaction.domain.LedgerEntry;
import com.securebank.transaction.domain.LedgerEntryRepository;
import com.securebank.transaction.domain.OutboxEvent;
import com.securebank.transaction.domain.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TransferApplicationService {

    private static final Logger log = LoggerFactory.getLogger(TransferApplicationService.class);

    private final BankingTransactionRepository transactions;
    private final LedgerEntryRepository ledgerEntries;
    private final OutboxEventRepository outboxEvents;
    private final IdempotencyRecordRepository idempotencyRecords;
    private final AccountClient accountClient;
    private final TenantGuard tenantGuard;
    private final TransactionMetrics metrics;
    private final ObjectMapper objectMapper;

    public TransferApplicationService(BankingTransactionRepository transactions,
                                      LedgerEntryRepository ledgerEntries,
                                      OutboxEventRepository outboxEvents,
                                      IdempotencyRecordRepository idempotencyRecords,
                                      AccountClient accountClient,
                                      TenantGuard tenantGuard,
                                      TransactionMetrics metrics,
                                      ObjectMapper objectMapper) {
        this.transactions = transactions;
        this.ledgerEntries = ledgerEntries;
        this.outboxEvents = outboxEvents;
        this.idempotencyRecords = idempotencyRecords;
        this.accountClient = accountClient;
        this.tenantGuard = tenantGuard;
        this.metrics = metrics;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public TransactionResponse transfer(CreateTransactionRequest request, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw BusinessException.badRequest(ErrorCode.VALIDATION_ERROR, "Idempotency-Key header is required");
        }
        String tenantId = TenantContext.require();
        String hash = sha256(request.sourceAccount() + "|" + request.destinationAccount()
                + "|" + request.amount() + "|" + request.currency());

        var existing = idempotencyRecords.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey);
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            if (!record.getRequestHash().equals(hash)) {
                throw BusinessException.conflict(ErrorCode.IDEMPOTENCY_KEY_CONFLICT,
                        "Idempotency key reused with a different payload");
            }
            if (record.getTransactionId() != null) {
                return get(record.getTransactionId());
            }
            throw BusinessException.conflict(ErrorCode.DUPLICATE_REQUEST, "A request with this key is already processing");
        }

        try {
            IdempotencyRecord placeholder = new IdempotencyRecord();
            placeholder.setTenantId(tenantId);
            placeholder.setIdempotencyKey(idempotencyKey);
            placeholder.setRequestHash(hash);
            placeholder.setStatusCode(202);
            idempotencyRecords.saveAndFlush(placeholder);
        } catch (DataIntegrityViolationException ex) {
            return transfer(request, idempotencyKey);
        }

        CurrentPrincipal principal = SecurityUtils.current();
        BankingTransaction tx = new BankingTransaction();
        tx.setTenantId(tenantId);
        tx.setSourceAccount(request.sourceAccount());
        tx.setDestinationAccount(request.destinationAccount());
        tx.setAmount(request.amount());
        tx.setCurrency(request.currency());
        tx.setInitiatedBy(principal.userId());
        transactions.save(tx);

        AccountSnapshot source;
        AccountSnapshot destination;
        try {
            source = accountClient.getByNumber(request.sourceAccount());
            destination = accountClient.getByNumber(request.destinationAccount());
            tenantGuard.assertSameTenant(source.tenantId());
            tenantGuard.assertSameTenant(destination.tenantId());
            if (principal.hasRole(Role.CUSTOMER)) {
                tenantGuard.assertOwnedByCustomer(source.ownerUserId());
            }
            TransferRules.validate(
                    source.accountNumber(),
                    destination.accountNumber(),
                    source.tenantId(),
                    destination.tenantId(),
                    source.status(),
                    destination.status(),
                    source.balance(),
                    request.amount(),
                    source.currency(),
                    destination.currency(),
                    request.currency()
            );
        } catch (RuntimeException ex) {
            fail(tx, tenantId, idempotencyKey, hash, ex);
            throw ex;
        }

        tx.transitionTo(TransactionStatus.PROCESSING);
        tx.setSourceAccountId(source.id());
        tx.setDestinationAccountId(destination.id());

        AccountTransferResponse movement;
        try {
            movement = accountClient.transfer(
                    request.sourceAccount(),
                    request.destinationAccount(),
                    request.amount(),
                    request.currency(),
                    idempotencyKey
            );
        } catch (RuntimeException ex) {
            fail(tx, tenantId, idempotencyKey, hash, ex);
            throw ex;
        }

        LedgerEntry debit = LedgerEntry.of(tx.getId(), movement.sourceAccountId(), movement.sourceAccount(),
                LedgerEntryType.DEBIT, request.amount(), request.currency(), tenantId);
        LedgerEntry credit = LedgerEntry.of(tx.getId(), movement.destinationAccountId(), movement.destinationAccount(),
                LedgerEntryType.CREDIT, request.amount(), request.currency(), tenantId);
        LedgerValidator.requireBalanced(List.of(
                LedgerPosting.debit(request.amount(), request.currency()),
                LedgerPosting.credit(request.amount(), request.currency())
        ));
        ledgerEntries.saveAll(List.of(debit, credit));
        tx.transitionTo(TransactionStatus.COMPLETED);
        appendOutbox(tx, "TransactionCompleted");
        persistIdempotency(tenantId, idempotencyKey, hash, tx);
        metrics.success();
        log.info("operation=transfer status=COMPLETED reference={} tenant={}", tx.getReference(), tenantId);
        return toResponse(tx, List.of(debit, credit));
    }

    private void fail(BankingTransaction tx, String tenantId, String idempotencyKey, String hash, RuntimeException ex) {
        tx.setFailureReason(ex.getMessage());
        if (tx.getStatus() == TransactionStatus.CREATED || tx.getStatus() == TransactionStatus.PROCESSING) {
            tx.transitionTo(TransactionStatus.FAILED);
        }
        appendOutbox(tx, "TransactionFailed");
        persistIdempotency(tenantId, idempotencyKey, hash, tx);
        metrics.failure();
        log.warn("operation=transfer status=FAILED reference={} reason={}", tx.getReference(), ex.getMessage());
    }

    @Transactional(readOnly = true)
    public TransactionResponse get(UUID id) {
        BankingTransaction tx;
        try (var ignored = com.securebank.common.security.jpa.TenantFilterBypass.open()) {
            tx = transactions.findById(id)
                    .orElseThrow(() -> BusinessException.notFound(ErrorCode.TRANSACTION_NOT_FOUND, "Transaction not found"));
        }
        tenantGuard.assertSameTenant(tx.getTenantId());
        return toResponse(tx, ledgerEntries.findByTransactionId(tx.getId()));
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> list() {
        return transactions.findAll().stream()
                .map(tx -> toResponse(tx, ledgerEntries.findByTransactionId(tx.getId())))
                .toList();
    }

    @Transactional
    public TransactionResponse cancel(UUID id) {
        BankingTransaction tx = transactions.findById(id)
                .orElseThrow(() -> BusinessException.notFound(ErrorCode.TRANSACTION_NOT_FOUND, "Transaction not found"));
        tenantGuard.assertSameTenant(tx.getTenantId());
        if (tx.getStatus() != TransactionStatus.COMPLETED) {
            throw BusinessException.unprocessable(ErrorCode.INVALID_STATE_TRANSITION,
                    "Only COMPLETED transactions can be reversed");
        }
        accountClient.reverse(tx.getSourceAccount(), tx.getDestinationAccount(), tx.getAmount(),
                tx.getCurrency(), "reverse-" + tx.getId());
        LedgerEntry debit = LedgerEntry.of(tx.getId(), tx.getDestinationAccountId(), tx.getDestinationAccount(),
                LedgerEntryType.DEBIT, tx.getAmount(), tx.getCurrency(), tx.getTenantId());
        LedgerEntry credit = LedgerEntry.of(tx.getId(), tx.getSourceAccountId(), tx.getSourceAccount(),
                LedgerEntryType.CREDIT, tx.getAmount(), tx.getCurrency(), tx.getTenantId());
        ledgerEntries.saveAll(List.of(debit, credit));
        tx.transitionTo(TransactionStatus.REVERSED);
        appendOutbox(tx, "TransactionReversed");
        return toResponse(tx, ledgerEntries.findByTransactionId(tx.getId()));
    }

    private void persistIdempotency(String tenantId, String key, String hash, BankingTransaction tx) {
        IdempotencyRecord record = idempotencyRecords.findByTenantIdAndIdempotencyKey(tenantId, key)
                .orElseGet(IdempotencyRecord::new);
        record.setTenantId(tenantId);
        record.setIdempotencyKey(key);
        record.setRequestHash(hash);
        record.setTransactionId(tx.getId());
        record.setStatusCode(tx.getStatus() == TransactionStatus.COMPLETED ? 201 : 422);
        try {
            record.setResponseBody(objectMapper.writeValueAsString(Map.of(
                    "id", tx.getId().toString(),
                    "reference", tx.getReference(),
                    "status", tx.getStatus().name()
            )));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        idempotencyRecords.save(record);
    }

    private void appendOutbox(BankingTransaction tx, String eventType) {
        try {
            java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("eventType", eventType);
            body.put("transactionId", tx.getId().toString());
            body.put("reference", tx.getReference());
            body.put("tenantId", tx.getTenantId());
            body.put("sourceAccount", tx.getSourceAccount());
            body.put("destinationAccount", tx.getDestinationAccount());
            body.put("amount", tx.getAmount());
            body.put("currency", tx.getCurrency());
            body.put("status", tx.getStatus().name());
            body.put("initiatedBy", tx.getInitiatedBy());
            body.put("traceId", MDC.get("traceId") == null ? "" : MDC.get("traceId"));
            String payload = objectMapper.writeValueAsString(body);
            outboxEvents.save(OutboxEvent.create(
                    tx.getTenantId(),
                    KafkaTopics.TRANSACTION_EVENTS,
                    "Transaction",
                    tx.getId().toString(),
                    eventType,
                    payload
            ));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private TransactionResponse toResponse(BankingTransaction tx, List<LedgerEntry> entries) {
        return new TransactionResponse(
                tx.getId(),
                tx.getReference(),
                tx.getTenantId(),
                tx.getSourceAccount(),
                tx.getDestinationAccount(),
                tx.getAmount(),
                tx.getCurrency(),
                tx.getStatus(),
                tx.getFailureReason(),
                entries.stream().map(e -> new LedgerEntryResponse(
                        e.getId(), e.getAccountNumber(), e.getEntryType(), e.getAmount(), e.getCurrency()
                )).toList(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
