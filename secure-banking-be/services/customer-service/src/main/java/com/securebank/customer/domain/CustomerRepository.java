package com.securebank.customer.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByKeycloakUserId(String keycloakUserId);

    Optional<Customer> findByEmailIgnoreCase(String email);

    List<Customer> findAllByTenantId(String tenantId);
}
