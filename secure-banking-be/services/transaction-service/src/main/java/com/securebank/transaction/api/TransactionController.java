package com.securebank.transaction.api;

import com.securebank.transaction.api.dto.CreateTransactionRequest;
import com.securebank.transaction.api.dto.TransactionResponse;
import com.securebank.transaction.service.TransferApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@Tag(name = "Transactions")
@SecurityRequirement(name = "bearer-jwt")
public class TransactionController {

    private final TransferApplicationService service;

    public TransactionController(TransferApplicationService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('transaction:create')")
    @Operation(summary = "Create a financial transfer")
    public TransactionResponse create(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateTransactionRequest request) {
        return service.transfer(request, idempotencyKey);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('transaction:read')")
    @Operation(summary = "List transactions for the current tenant")
    public List<TransactionResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('transaction:read')")
    @Operation(summary = "Get a transaction by id")
    public TransactionResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('transaction:cancel')")
    @Operation(summary = "Reverse a completed transaction")
    public TransactionResponse cancel(@PathVariable UUID id) {
        return service.cancel(id);
    }
}
