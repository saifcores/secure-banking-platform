package com.securebank.customer.api;

import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import com.securebank.common.domain.security.CurrentPrincipal;
import com.securebank.common.domain.security.Role;
import com.securebank.common.security.principal.SecurityUtils;
import com.securebank.common.security.tenant.TenantContext;
import com.securebank.common.security.tenant.TenantGuard;
import com.securebank.customer.api.dto.CustomerResponse;
import com.securebank.customer.api.dto.UpdateCustomerRequest;
import com.securebank.customer.domain.Customer;
import com.securebank.customer.domain.CustomerRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CustomerApplicationService {

    private final CustomerRepository repository;
    private final TenantGuard tenantGuard;

    public CustomerApplicationService(CustomerRepository repository, TenantGuard tenantGuard) {
        this.repository = repository;
        this.tenantGuard = tenantGuard;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> list() {
        CurrentPrincipal principal = SecurityUtils.current();
        if (principal.hasRole(Role.CUSTOMER)) {
            return List.of(toResponse(requireCurrent(principal, currentEmail())));
        }
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(UUID id) {
        Customer customer;
        try (var ignored = com.securebank.common.security.jpa.TenantFilterBypass.open()) {
            customer = repository.findById(id)
                    .orElseThrow(() -> BusinessException.notFound(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));
        }
        tenantGuard.assertSameTenant(customer.getTenantId());
        tenantGuard.assertOwnedByCustomer(customer.getKeycloakUserId());
        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public CustomerResponse me() {
        CurrentPrincipal principal = SecurityUtils.current();
        return toResponse(requireCurrent(principal, currentEmail()));
    }

    @Transactional
    public CustomerResponse update(UUID id, UpdateCustomerRequest request) {
        Customer customer = repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));
        tenantGuard.assertSameTenant(customer.getTenantId());
        CurrentPrincipal principal = SecurityUtils.current();
        if (principal.hasRole(Role.CUSTOMER)) {
            tenantGuard.assertOwnedByCustomer(customer.getKeycloakUserId());
        }
        customer.setFirstName(request.firstName());
        customer.setLastName(request.lastName());
        customer.setEmail(request.email());
        customer.setPhone(request.phone());
        customer.touch();
        return toResponse(customer);
    }

    private Customer requireCurrent(CurrentPrincipal principal, String email) {
        return repository.findByKeycloakUserId(principal.userId())
                .or(() -> {
                    if (email == null) {
                        return java.util.Optional.empty();
                    }
                    return repository.findByEmailIgnoreCase(email).map(customer -> {
                        customer.setKeycloakUserId(principal.userId());
                        return customer;
                    });
                })
                .orElseThrow(() -> BusinessException.notFound(ErrorCode.CUSTOMER_NOT_FOUND, "Customer profile not found"));
    }

    private String currentEmail() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            Jwt jwt = token.getToken();
            return jwt.getClaimAsString("email");
        }
        return null;
    }

    private CustomerResponse toResponse(Customer customer) {
        if (customer.getTenantId() == null) {
            customer.setTenantId(TenantContext.get());
        }
        return new CustomerResponse(
                customer.getId(),
                customer.getTenantId(),
                customer.getKeycloakUserId(),
                customer.getFirstName(),
                customer.getLastName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getStatus(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}
