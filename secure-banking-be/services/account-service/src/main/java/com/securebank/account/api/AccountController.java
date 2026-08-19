package com.securebank.account.api;

import com.securebank.account.api.dto.AccountResponse;
import com.securebank.account.api.dto.CreateAccountRequest;
import com.securebank.account.api.dto.UpdateAccountRequest;
import com.securebank.account.service.AccountApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@Tag(name = "Accounts")
@SecurityRequirement(name = "bearer-jwt")
public class AccountController {

    private final AccountApplicationService service;

    public AccountController(AccountApplicationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('account:read')")
    @Operation(summary = "List accounts for the current tenant")
    public List<AccountResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('account:read')")
    @Operation(summary = "Get an account by id")
    public AccountResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('account:create')")
    @Operation(summary = "Create an account")
    public AccountResponse create(@Valid @RequestBody CreateAccountRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('account:update')")
    @Operation(summary = "Update account status")
    public AccountResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateAccountRequest request) {
        return service.update(id, request);
    }
}
