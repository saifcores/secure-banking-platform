# OAuth2 / OIDC flows

Realm: `banking`. Issuer (local): `http://localhost:8085/realms/banking`.

## Clients

| Client | Type | Use |
| --- | --- | --- |
| banking-frontend | public, PKCE | Browser login |
| banking-api | confidential | API audience / future BFF |
| transaction-service | confidential, service account | S2S client credentials |

## User login (Authorization Code + PKCE)

```
User → Frontend → Keycloak /auth → code → /token → access_token
Frontend → Gateway → Resource servers (Bearer)
```

Access token claims used by the platform:

- `sub` — user id
- `preferred_username`, `email`
- `tenant_id` — user attribute mapper
- `realm_access.roles` — CUSTOMER / OPERATOR / SUPPORT / AUDITOR / ADMIN / SERVICE

Backends are **OAuth2 resource servers**. They do not store passwords.

## Service-to-service (Client Credentials)

```
transaction-service → Keycloak /token (client_id=transaction-service)
                   → account-service Authorization: Bearer <cc token>
                   → X-Tenant-Id: <user tenant from original request>
```

The service account has realm role `SERVICE`. Account internal APIs require `ROLE_SERVICE` or `account:update`.

## Token failure modes

| Case | Result |
| --- | --- |
| Missing / malformed Bearer | 401 UNAUTHENTICATED |
| Expired JWT | 401 |
| Valid JWT, missing permission | 403 ACCESS_DENIED |
| Valid JWT, wrong tenant | 403 TENANT_ACCESS_DENIED |

Local password grant against `banking-frontend` is enabled **for demos and tests only**.
