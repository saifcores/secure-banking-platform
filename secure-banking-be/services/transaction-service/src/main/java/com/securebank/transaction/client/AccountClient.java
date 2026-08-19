package com.securebank.transaction.client;

public interface AccountClient {

    AccountSnapshot getByNumber(String accountNumber);

    AccountTransferResponse transfer(String sourceAccount, String destinationAccount,
                                     java.math.BigDecimal amount, String currency,
                                     String idempotencyKey);

    AccountTransferResponse reverse(String sourceAccount, String destinationAccount,
                                    java.math.BigDecimal amount, String currency,
                                    String idempotencyKey);
}
