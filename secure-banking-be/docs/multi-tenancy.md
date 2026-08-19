# Multi-tenancy

Discriminator column `tenant_id` on every tenant-aware entity. Tenants:

- `BANK_DAKAR` (account prefix `DK`)
- `BANK_ABIDJAN` (`AB`)
- `BANK_BAMAKO` (`BM`)
- `PLATFORM` (global admin / auditor)

## Resolution order

1. `X-Tenant-Id` if caller is `ADMIN` or `SERVICE`.
2. Else JWT `tenant_id`.
3. Header that disagrees with a non-admin JWT → `TENANT_ACCESS_DENIED` (logged).

## Isolation

- Hibernate filter `tenantFilter` on repositories (lists cannot leak other banks).
- Get-by-id loads without the filter, then `TenantGuard` returns **403** so the demo scenario is explicit:
  - User A (`BANK_DAKAR`) → account of `BANK_ABIDJAN` → `TENANT_ACCESS_DENIED`.
- Transfers cannot credit a destination in another tenant.

## Global admin

`ADMIN` with `PLATFORM` may pass `X-Tenant-Id` to supervise a bank. Cross-tenant probes by customers are denied and logged (`TENANT_ACCESS_DENIED`).
