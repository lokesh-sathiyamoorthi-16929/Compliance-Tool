# ADManager Plus API v2 (ComplianceIQ Canonical Reference)

**Source:** `https://www.manageengine.com/products/ad-manager/active-directory-api/v2/`  
**Verified by:** human-pasted docs on 2026-05-11 (do NOT replace with inferred values)

## Common conventions

- **Base path**: `/api/v2/...` (e.g. `http://admanagerplus:8080/api/v2/users`)
- **Auth header**: `Authorization: <raw_token>` — the token value, **NOT** prefixed with `Bearer `
- **Recommended headers**:
  - `Accept: application/json`
  - `X-Module: ComplianceIQ` (audit-log tag)
  - `X-Date-Time-Format: yyyy-MM-dd'T'HH:mm:ss[.SSS][XXX]` (ISO default)
- **Pagination**: query params `from` (1-based start_index) + `limit`. Response: `meta: { start_index, limit, total_no_of_objects }`
- **Filter syntax**: SCIM-style. Examples:
  - `(FIRST_NAME eq John) and (LAST_NAME eq Doe)`
  - `(ACCOUNT_STATUS eq Disabled)`
  - `(DAYS_SINCE_LAST_LOGON gt 90)`
- **Sort syntax**: `FIRST_NAME,-LAST_NAME` (hyphen prefix = descending)
- **Required query param**: `domains=domain1.com,domain2.com` on every GET; `domain=domain1.com` (singular) on PATCH/POST/DELETE
- **`refresh=true`** forces fresh AD sync before returning
- **`fields=COL1,COL2`** limits response columns (always specify to keep payloads small)

## Endpoints used by ComplianceIQ (read-only)

| Method | Path | ComplianceIQ purpose |
|---|---|---|
| `GET` | `/api/v2/users` | List users with status/lockout/last-logon/password attributes |
| `GET` | `/api/v2/groups` | List groups (find Domain Admins / Enterprise Admins) |
| `GET` | `/api/v2/computers` | List computers + BitLocker + OS + last-logon |
| `GET` | `/api/v2/organizational_units` | (optional, low priority for v1) |

## Endpoints explicitly NOT used in v1 (write actions / out-of-scope)

- `PATCH /api/v2/users` (write)
- `PATCH /api/v2/groups` (write)
- `POST /api/v2/computers` / `PATCH /api/v2/computers` / `POST /api/v2/computers/disable` (write)
- `POST /api/v2/orchestrations/{id}/execute` (write)
- All `/api/v2/admin_settings/*` endpoints (config writes / org-attribute lists)
- All `/api/v2/contacts` endpoints (no compliance value)

## Error format (verified)

```json
{ "error": { "code": "00000101", "title": "Unauthorized", "detail": "..." } }
```

Codes to handle gracefully:

- `00000101` Unauthorized → prompt user to re-enter token
- `00000106` Forbidden → token valid but lacks scope; show "token needs `All Users Report` / `All Groups Report` / `All Computers Report` delegated role"
- `00000109` Too Many Requests → exponential backoff
- `00000100` Bad Request / `00010104` Invalid Attribute → log the offending `fields=` / `filter=` value

## Verified test/health endpoint

`GET /api/v2/users?domains=<defaultDomain>&limit=1&fields=SAM_ACCOUNT_NAME` — returns 200 with valid token + valid domain. Use this for connection tests and "re-test" buttons.

## Verified response example (Users — confirms shape)

```json
{
  "data": [
    {
      "EMPLOYEE_ID": "1",
      "LOGON_NAME": "testuser1@domain.com",
      "SAM_ACCOUNT_NAME": "testuserapi1",
      "DISTINGUISHED_NAME": "CN=testuser1,CN=Users,DC=domain,DC=com",
      "DOMAIN_NAME": "domain.com"
    }
  ],
  "meta": { "start_index": 1, "limit": 10, "total_no_of_objects": 2 }
}
```
