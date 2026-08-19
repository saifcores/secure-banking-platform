package com.securebank.transaction.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BankingTransactionRepository extends JpaRepository<BankingTransaction, UUID> {
}
