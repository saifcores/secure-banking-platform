package com.securebank.transaction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.securebank.common.domain.account.AccountStatus;
import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.security.CurrentPrincipal;
import com.securebank.common.domain.security.Permission;
import com.securebank.common.domain.security.Role;
import com.securebank.common.domain.transaction.TransactionStatus;
import com.securebank.common.security.tenant.TenantContext;
import com.securebank.common.security.tenant.TenantGuard;
import com.securebank.transaction.api.dto.CreateTransactionRequest;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransferApplicationServiceTest {

    @Mock BankingTransactionRepository transactions;
    @Mock LedgerEntryRepository ledgerEntries;
    @Mock OutboxEventRepository outboxEvents;
    @Mock IdempotencyRecordRepository idempotencyRecords;
    @Mock AccountClient accountClient;
    @Mock TransactionMetrics metrics;

    private TransferApplicationService service;

    @BeforeEach
    void setUp() {
        service = new TransferApplicationService(
                transactions, ledgerEntries, outboxEvents, idempotencyRecords,
                accountClient, new TenantGuard(), metrics, new ObjectMapper()
        );
        TenantContext.set("BANK_DAKAR");
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("user-dakar")
                .claim("preferred_username", "awa.diop")
                .claim("email", "awa.diop@bank-dakar.local")
                .claim("tenant_id", "BANK_DAKAR")
                .claim("realm_access", java.util.Map.of("roles", List.of("CUSTOMER")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new JwtAuthenticationToken(jwt, List.of())
        );
        org.mockito.Mockito.lenient().when(transactions.save(any(BankingTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.lenient().when(idempotencyRecords.findByTenantIdAndIdempotencyKey(any(), any())).thenReturn(Optional.empty());
        org.mockito.Mockito.lenient().when(idempotencyRecords.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.lenient().when(idempotencyRecords.save(any())).thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.lenient().when(ledgerEntries.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.lenient().when(outboxEvents.save(any(OutboxEvent.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void completesTransferAndWritesBalancedLedger() {
        AccountSnapshot source = snapshot("DK001234", "BANK_DAKAR", "user-dakar", new BigDecimal("500000"));
        AccountSnapshot dest = snapshot("DK005678", "BANK_DAKAR", "user-dakar", new BigDecimal("250000"));
        when(accountClient.getByNumber("DK001234")).thenReturn(source);
        when(accountClient.getByNumber("DK005678")).thenReturn(dest);
        when(accountClient.transfer(any(), any(), any(), any(), any()))
                .thenReturn(new AccountTransferResponse(source.id(), dest.id(), "DK001234", "DK005678",
                        "BANK_DAKAR", new BigDecimal("350000"), new BigDecimal("400000"), "XOF"));

        var response = service.transfer(new CreateTransactionRequest(
                "DK001234", "DK005678", new BigDecimal("150000"), "XOF"), "ABC123");

        assertThat(response.status()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(response.ledgerEntries()).hasSize(2);
        verify(metrics).success();
        verify(outboxEvents).save(any(OutboxEvent.class));
    }

    @Test
    void returnsExistingTransactionForSameIdempotencyKey() {
        UUID existingId;
        BankingTransaction existing = new BankingTransaction();
        existing.setSourceAccount("DK001234");
        existing.setDestinationAccount("DK005678");
        existing.setAmount(new BigDecimal("150000"));
        existing.setCurrency("XOF");
        existing.setInitiatedBy("user-dakar");
        existing.setTenantId("BANK_DAKAR");
        existing.transitionTo(TransactionStatus.PROCESSING);
        existing.transitionTo(TransactionStatus.COMPLETED);
        existingId = existing.getId();
        IdempotencyRecord record = new IdempotencyRecord();
        record.setRequestHash(sha("DK001234|DK005678|150000|XOF"));
        record.setTransactionId(existingId);
        when(idempotencyRecords.findByTenantIdAndIdempotencyKey("BANK_DAKAR", "ABC123"))
                .thenReturn(Optional.of(record));
        when(transactions.findById(existingId)).thenReturn(Optional.of(existing));
        when(ledgerEntries.findByTransactionId(existingId)).thenReturn(List.of());

        var first = service.transfer(new CreateTransactionRequest(
                "DK001234", "DK005678", new BigDecimal("150000"), "XOF"), "ABC123");
        var second = service.transfer(new CreateTransactionRequest(
                "DK001234", "DK005678", new BigDecimal("150000"), "XOF"), "ABC123");

        assertThat(first.id()).isEqualTo(second.id());
        verify(accountClient, never()).transfer(any(), any(), any(), any(), any());
    }

    @Test
    void rejectsCrossTenantAccount() {
        when(accountClient.getByNumber("DK001234"))
                .thenReturn(snapshot("DK001234", "BANK_DAKAR", "user-dakar", new BigDecimal("500000")));
        when(accountClient.getByNumber("AB001234"))
                .thenReturn(snapshot("AB001234", "BANK_ABIDJAN", "user-abidjan", new BigDecimal("800000")));

        assertThatThrownBy(() -> service.transfer(new CreateTransactionRequest(
                "DK001234", "AB001234", new BigDecimal("1000"), "XOF"), "K1"))
                .isInstanceOf(BusinessException.class);
        verify(metrics).failure();
    }

    private AccountSnapshot snapshot(String number, String tenant, String owner, BigDecimal balance) {
        return new AccountSnapshot(UUID.randomUUID(), number, UUID.randomUUID(), owner, tenant,
                "XOF", balance, AccountStatus.ACTIVE);
    }

    private String sha(String value) {
        try {
            return java.util.HexFormat.of().formatHex(
                    java.security.MessageDigest.getInstance("SHA-256")
                            .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
