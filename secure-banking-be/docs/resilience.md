# Resilience

Transaction → Account calls use Resilience4j:

| Mechanism | Config (default) | Compatible with money? |
| --- | --- | --- |
| Timeout | 3s | Yes — fail the attempt |
| Retry | 3 × 200ms on I/O | Yes — same `Idempotency-Key` |
| Circuit breaker | 10-call window, 50% | Yes — fail closed to 503 |
| Gateway CB | per-route fallback | Returns `503 INTERNAL_ERROR` JSON |

Retries are **not** blind replays of a non-idempotent debit. The account posting API is idempotent.

Fallback never invents `COMPLETED`. If the circuit is open, the transaction is marked `FAILED` (before money movement) or retried later with the same key (after money movement).

Distributed errors use the standard body:

```json
{
  "timestamp": "2026-08-19T13:00:00Z",
  "status": 403,
  "code": "ACCESS_DENIED",
  "message": "You are not authorized to access this resource",
  "traceId": "abc-123"
}
```
