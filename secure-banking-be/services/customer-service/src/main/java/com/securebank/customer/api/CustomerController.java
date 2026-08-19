package com.securebank.customer.api;

import com.securebank.customer.api.dto.CustomerResponse;
import com.securebank.customer.api.dto.UpdateCustomerRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
@Tag(name = "Customers")
@SecurityRequirement(name = "bearer-jwt")
public class CustomerController {

    private final CustomerApplicationService service;

    public CustomerController(CustomerApplicationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('customer:read')")
    @Operation(summary = "List customers in the current tenant")
    public List<CustomerResponse> list() {
        return service.list();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('customer:read')")
    @Operation(summary = "Get the authenticated customer profile")
    public CustomerResponse me() {
        return service.me();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('customer:read')")
    @Operation(summary = "Get a customer by id")
    public CustomerResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('customer:update')")
    @Operation(summary = "Update a customer profile")
    public CustomerResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateCustomerRequest request) {
        return service.update(id, request);
    }
}
