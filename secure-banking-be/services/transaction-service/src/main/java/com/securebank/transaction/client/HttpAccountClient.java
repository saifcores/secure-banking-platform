package com.securebank.transaction.client;

import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import com.securebank.common.security.tenant.TenantContext;
import com.securebank.common.web.correlation.CorrelationIdFilter;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Map;

@Component
public class HttpAccountClient implements AccountClient {

    private static final Logger log = LoggerFactory.getLogger(HttpAccountClient.class);

    private final WebClient webClient;

    public HttpAccountClient(WebClient accountWebClient) {
        this.webClient = accountWebClient;
    }

    @Override
    @CircuitBreaker(name = "accountService", fallbackMethod = "getByNumberFallback")
    @Retry(name = "accountService")
    public AccountSnapshot getByNumber(String accountNumber) {
        return webClient.get()
                .uri("/internal/v1/accounts/by-number/{number}", accountNumber)
                .headers(this::propagate)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                        .map(body -> mapError(response.statusCode().value(), body)))
                .bodyToMono(AccountSnapshot.class)
                .timeout(Duration.ofSeconds(3))
                .block();
    }

    @Override
    @CircuitBreaker(name = "accountService", fallbackMethod = "transferFallback")
    @Retry(name = "accountService")
    public AccountTransferResponse transfer(String sourceAccount, String destinationAccount,
                                            BigDecimal amount, String currency, String idempotencyKey) {
        return postTransfer("/internal/v1/accounts/transfers", sourceAccount, destinationAccount,
                amount, currency, idempotencyKey);
    }

    @Override
    @CircuitBreaker(name = "accountService", fallbackMethod = "reverseFallback")
    @Retry(name = "accountService")
    public AccountTransferResponse reverse(String sourceAccount, String destinationAccount,
                                           BigDecimal amount, String currency, String idempotencyKey) {
        return postTransfer("/internal/v1/accounts/transfers/reverse", sourceAccount, destinationAccount,
                amount, currency, idempotencyKey);
    }

    private AccountTransferResponse postTransfer(String path, String source, String destination,
                                                 BigDecimal amount, String currency, String idempotencyKey) {
        return webClient.post()
                .uri(path)
                .headers(headers -> {
                    propagate(headers);
                    headers.set("Idempotency-Key", idempotencyKey);
                })
                .bodyValue(Map.of(
                        "sourceAccount", source,
                        "destinationAccount", destination,
                        "amount", amount,
                        "currency", currency
                ))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                        .map(body -> mapError(response.statusCode().value(), body)))
                .bodyToMono(AccountTransferResponse.class)
                .timeout(Duration.ofSeconds(3))
                .block();
    }

    private void propagate(org.springframework.http.HttpHeaders headers) {
        headers.set("X-Tenant-Id", TenantContext.get());
        String correlationId = MDC.get(CorrelationIdFilter.MDC_KEY);
        if (correlationId != null) {
            headers.set(CorrelationIdFilter.HEADER, correlationId);
        }
    }

    private RuntimeException mapError(int status, String body) {
        if (status == 404) {
            return BusinessException.notFound(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found");
        }
        if (body != null && body.contains("INSUFFICIENT_BALANCE")) {
            return BusinessException.unprocessable(ErrorCode.INSUFFICIENT_BALANCE, "Insufficient balance");
        }
        if (body != null && body.contains("ACCOUNT_BLOCKED")) {
            return BusinessException.unprocessable(ErrorCode.ACCOUNT_BLOCKED, "Account is blocked");
        }
        if (body != null && body.contains("TENANT_ACCESS_DENIED")) {
            return BusinessException.forbidden(ErrorCode.TENANT_ACCESS_DENIED, "Cross-tenant access is not allowed");
        }
        return BusinessException.unprocessable(ErrorCode.INVALID_TRANSACTION, "Account service rejected the request");
    }

    @SuppressWarnings("unused")
    private AccountSnapshot getByNumberFallback(String accountNumber, Throwable ex) {
        return rethrow(ex);
    }

    @SuppressWarnings("unused")
    private AccountTransferResponse transferFallback(String sourceAccount, String destinationAccount,
                                                     BigDecimal amount, String currency,
                                                     String idempotencyKey, Throwable ex) {
        return rethrow(ex);
    }

    @SuppressWarnings("unused")
    private AccountTransferResponse reverseFallback(String sourceAccount, String destinationAccount,
                                                    BigDecimal amount, String currency,
                                                    String idempotencyKey, Throwable ex) {
        return rethrow(ex);
    }

    private <T> T rethrow(Throwable ex) {
        log.warn("Account service call failed: {}", ex.toString());
        if (ex instanceof BusinessException businessException) {
            throw businessException;
        }
        if (ex instanceof WebClientResponseException webEx) {
            throw mapError(webEx.getStatusCode().value(), webEx.getResponseBodyAsString());
        }
        throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                "Account service is temporarily unavailable", 503);
    }
}
