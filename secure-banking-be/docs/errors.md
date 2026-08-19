# Error catalog

All resource servers return the same JSON body (`ApiError` from `common-web`):

```json
{
  "timestamp": "2026-08-19T13:00:00Z",
  "status": 403,
  "code": "ACCESS_DENIED",
  "message": "You are not authorized to access this resource",
  "traceId": "abc-123",
  "path": "/api/v1/accounts/bbbb1111-1111-1111-1111-111111111111"
}
```

`traceId` is taken from MDC (`traceId` or `correlationId`). Gateway fallbacks use the same `code` / `status` shape without `path`.

## Codes

| `ErrorCode`                | Typical HTTP | When                                                                           |
| -------------------------- | -----------: | ------------------------------------------------------------------------------ |
| `UNAUTHENTICATED`          |          401 | Missing, malformed, or expired Bearer JWT                                      |
| `ACCESS_DENIED`            |          403 | Authenticated but missing permission, or CUSTOMER horizontal access            |
| `TENANT_ACCESS_DENIED`     |          403 | JWT tenant ≠ resource tenant; header/JWT mismatch; unresolved tenant           |
| `VALIDATION_ERROR`         |          400 | Bean Validation, missing `Idempotency-Key`, type mismatch                      |
| `INVALID_TRANSACTION`      |    400 / 422 | Same source/destination, non-operable accounts, generic account-service reject |
| `CURRENCY_MISMATCH`        |          400 | Source, destination, and request currencies differ                             |
| `CUSTOMER_NOT_FOUND`       |          404 | Unknown customer id or no profile for the current user                         |
| `ACCOUNT_NOT_FOUND`        |          404 | Unknown account id or number                                                   |
| `TRANSACTION_NOT_FOUND`    |          404 | Unknown transaction id                                                         |
| `ACCOUNT_BLOCKED`          |          422 | Source or destination `BLOCKED`                                                |
| `ACCOUNT_CLOSED`           |          422 | Source or destination `CLOSED`                                                 |
| `INSUFFICIENT_BALANCE`     |          422 | Debit would go negative                                                        |
| `INVALID_STATE_TRANSITION` |          422 | Illegal status change, or cancel of a non-`COMPLETED` transfer                 |
| `LEDGER_IMBALANCE`         |          422 | Debits ≠ credits (should never reach the client if orchestration is correct)   |
| `DUPLICATE_REQUEST`        |          409 | Idempotency key reserved but not yet bound to a transaction                    |
| `IDEMPOTENCY_KEY_CONFLICT` |          409 | Same key, different payload hash                                               |
| `INTERNAL_ERROR`           |    500 / 503 | Unexpected exception, or account-service / gateway circuit open                |

## Mapping in code

- Domain: `BusinessException` factories (`badRequest` 400, `forbidden` 403, `notFound` 404, `conflict` 409, `unprocessable` 422).
- HTTP: `GlobalExceptionHandler` plus JWT `authenticationEntryPoint` / `accessDeniedHandler` in `ResourceServerSecurityConfig`.
- S2S: `HttpAccountClient` maps account-service status/body fragments (`INSUFFICIENT_BALANCE`, `ACCOUNT_BLOCKED`, `TENANT_ACCESS_DENIED`, 404) back to the same codes. Circuit/timeout fallbacks become `503 INTERNAL_ERROR`.

Messages are safe to return to a client. They never include tokens, passwords, or client secrets.
