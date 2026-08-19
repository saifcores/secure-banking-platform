# Idempotence

Critical financial writes require:

```http
Idempotency-Key: <unique-key>
```

Stored per `(tenant_id, idempotency_key)` with a SHA-256 of the canonical payload.

| Second request | Result |
| --- | --- |
| Same key, same payload | Original transaction / movement, HTTP replay |
| Same key, different payload | `409 IDEMPOTENCY_KEY_CONFLICT` |
| Missing key | `400 VALIDATION_ERROR` |

## Two layers

1. **Transaction service** — one business transaction per key.
2. **Account service** — one debit+credit pair per key.

Retries (gateway, Resilience4j, client repeat) therefore cannot double-spend.

Unique constraint + `saveAndFlush` turns concurrent duplicates into a single winner; the loser reloads the existing record.
