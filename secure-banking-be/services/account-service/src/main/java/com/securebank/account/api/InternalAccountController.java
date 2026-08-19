package com.securebank.account.api;

import com.securebank.account.api.dto.AccountSnapshot;
import com.securebank.account.api.dto.InternalTransferRequest;
import com.securebank.account.api.dto.InternalTransferResponse;
import com.securebank.account.service.AccountApplicationService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/accounts")
@Hidden
public class InternalAccountController {

    private final AccountApplicationService service;

    public InternalAccountController(AccountApplicationService service) {
        this.service = service;
    }

    @GetMapping("/by-number/{accountNumber}")
    @PreAuthorize("hasRole('SERVICE') or hasAuthority('account:read')")
    public AccountSnapshot byNumber(@PathVariable String accountNumber) {
        return service.snapshotByNumber(accountNumber);
    }

    @PostMapping("/transfers")
    @PreAuthorize("hasRole('SERVICE') or hasAuthority('account:update')")
    public InternalTransferResponse transfer(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody InternalTransferRequest request) {
        return service.transfer(request, idempotencyKey);
    }

    @PostMapping("/transfers/reverse")
    @PreAuthorize("hasRole('SERVICE') or hasAuthority('account:update')")
    public InternalTransferResponse reverse(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody InternalTransferRequest request) {
        return service.reverse(request, idempotencyKey);
    }
}
