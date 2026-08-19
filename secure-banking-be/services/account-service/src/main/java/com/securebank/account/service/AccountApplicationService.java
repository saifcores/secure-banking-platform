package com.securebank.account.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securebank.account.api.dto.AccountResponse;
import com.securebank.account.api.dto.AccountSnapshot;
import com.securebank.account.api.dto.CreateAccountRequest;
import com.securebank.account.api.dto.InternalTransferRequest;
import com.securebank.account.api.dto.InternalTransferResponse;
import com.securebank.account.api.dto.UpdateAccountRequest;
import com.securebank.account.domain.Account;
import com.securebank.account.domain.AccountIdempotencyRecord;
import com.securebank.account.domain.AccountIdempotencyRepository;
import com.securebank.account.domain.AccountRepository;
import com.securebank.common.domain.account.AccountStatus;
import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import com.securebank.common.domain.security.CurrentPrincipal;
import com.securebank.common.domain.security.Role;
import com.securebank.common.domain.tenant.Tenant;
import com.securebank.common.domain.transaction.TransferRules;
import com.securebank.common.security.principal.SecurityUtils;
import com.securebank.common.security.tenant.TenantContext;
import com.securebank.common.security.tenant.TenantGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class AccountApplicationService {

    private final AccountRepository accounts;
    private final AccountIdempotencyRepository idempotencyRepository;
    private final TenantGuard tenantGuard;
    private final ObjectMapper objectMapper;

    public AccountApplicationService(AccountRepository accounts,
                                     AccountIdempotencyRepository idempotencyRepository,
                                     TenantGuard tenantGuard,
                                     ObjectMapper objectMapper) {
        this.accounts = accounts;
        this.idempotencyRepository = idempotencyRepository;
        this.tenantGuard = tenantGuard;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> list() {
        CurrentPrincipal principal = SecurityUtils.current();
        List<Account> result;
        if (principal.hasRole(Role.CUSTOMER)) {
            result = accounts.findByOwnerUserId(principal.userId());
            if (result.isEmpty() && currentEmail() != null) {
                result = accounts.findByOwnerEmailIgnoreCase(currentEmail());
                result.forEach(account -> account.setOwnerUserId(principal.userId()));
            }
        } else {
            result = accounts.findAll();
        }
        return result.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse get(UUID id) {
        Account account;
        try (var ignored = com.securebank.common.security.jpa.TenantFilterBypass.open()) {
            account = accounts.findById(id)
                    .orElseThrow(() -> BusinessException.notFound(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found"));
        }
        tenantGuard.assertSameTenant(account.getTenantId());
        tenantGuard.assertOwnedByCustomer(account.getOwnerUserId());
        return toResponse(account);
    }

    @Transactional
    public AccountResponse create(CreateAccountRequest request) {
        Account account = new Account();
        account.setTenantId(TenantContext.require());
        account.setCustomerId(request.customerId());
        account.setOwnerUserId(request.ownerUserId());
        account.setOwnerEmail(request.ownerEmail() == null ? request.ownerUserId() : request.ownerEmail());
        account.setCurrency(request.currency() == null ? Tenant.require(account.getTenantId()).getDefaultCurrency() : request.currency());
        account.setBalance(request.initialBalance() == null ? BigDecimal.ZERO : request.initialBalance());
        account.setStatus(AccountStatus.ACTIVE);
        account.setAccountNumber(AccountNumberGenerator.next());
        return toResponse(accounts.save(account));
    }

    @Transactional
    public AccountResponse update(UUID id, UpdateAccountRequest request) {
        Account account = accounts.findById(id)
                .orElseThrow(() -> BusinessException.notFound(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found"));
        tenantGuard.assertSameTenant(account.getTenantId());
        account.setStatus(request.status());
        account.touch();
        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public AccountSnapshot snapshotByNumber(String accountNumber) {
        Account account = accounts.findByAccountNumber(accountNumber)
                .orElseThrow(() -> BusinessException.notFound(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found"));
        tenantGuard.assertSameTenant(account.getTenantId());
        return toSnapshot(account);
    }

    @Transactional
    public InternalTransferResponse transfer(InternalTransferRequest request, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw BusinessException.badRequest(ErrorCode.VALIDATION_ERROR, "Idempotency-Key is required");
        }
        String tenantId = TenantContext.require();
        String hash = sha256(request.sourceAccount() + "|" + request.destinationAccount()
                + "|" + request.amount() + "|" + request.currency());
        var existing = idempotencyRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey);
        if (existing.isPresent()) {
            AccountIdempotencyRecord record = existing.get();
            if (!record.getRequestHash().equals(hash)) {
                throw BusinessException.conflict(ErrorCode.IDEMPOTENCY_KEY_CONFLICT,
                        "Idempotency key reused with a different payload");
            }
            try {
                return objectMapper.readValue(record.getResponseBody(), InternalTransferResponse.class);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException("Corrupt idempotency record", e);
            }
        }

        Account source = accounts.findByAccountNumberForUpdate(request.sourceAccount())
                .orElseThrow(() -> BusinessException.notFound(ErrorCode.ACCOUNT_NOT_FOUND, "Source account not found"));
        Account destination = accounts.findByAccountNumberForUpdate(request.destinationAccount())
                .orElseThrow(() -> BusinessException.notFound(ErrorCode.ACCOUNT_NOT_FOUND, "Destination account not found"));
        tenantGuard.assertSameTenant(source.getTenantId());
        tenantGuard.assertSameTenant(destination.getTenantId());

        TransferRules.validate(
                source.getAccountNumber(),
                destination.getAccountNumber(),
                source.getTenantId(),
                destination.getTenantId(),
                source.getStatus(),
                destination.getStatus(),
                source.getBalance(),
                request.amount(),
                source.getCurrency(),
                destination.getCurrency(),
                request.currency()
        );

        source.debit(request.amount());
        destination.credit(request.amount());

        InternalTransferResponse response = new InternalTransferResponse(
                source.getId(),
                destination.getId(),
                source.getAccountNumber(),
                destination.getAccountNumber(),
                source.getTenantId(),
                source.getBalance(),
                destination.getBalance(),
                source.getCurrency()
        );

        AccountIdempotencyRecord record = new AccountIdempotencyRecord();
        record.setTenantId(tenantId);
        record.setIdempotencyKey(idempotencyKey);
        record.setRequestHash(hash);
        record.setStatusCode(200);
        try {
            record.setResponseBody(objectMapper.writeValueAsString(response));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        record.setCreatedAt(Instant.now());
        idempotencyRepository.save(record);
        return response;
    }

    @Transactional
    public InternalTransferResponse reverse(InternalTransferRequest request, String idempotencyKey) {
        InternalTransferRequest reversed = new InternalTransferRequest(
                request.destinationAccount(),
                request.sourceAccount(),
                request.amount(),
                request.currency(),
                request.transactionId()
        );
        return transfer(reversed, idempotencyKey + ":reverse");
    }

    private AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getCustomerId(),
                account.getTenantId(),
                account.getCurrency(),
                account.getBalance(),
                account.getStatus(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }

    private AccountSnapshot toSnapshot(Account account) {
        return new AccountSnapshot(
                account.getId(),
                account.getAccountNumber(),
                account.getCustomerId(),
                account.getOwnerUserId(),
                account.getTenantId(),
                account.getCurrency(),
                account.getBalance(),
                account.getStatus()
        );
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private String currentEmail() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken token) {
            return token.getToken().getClaimAsString("email");
        }
        return null;
    }
}
