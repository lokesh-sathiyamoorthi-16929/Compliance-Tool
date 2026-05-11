# AD360 Backend Proxy Contract (Companion PR Spec)

This frontend PR expects the backend API to expose these endpoints:

## Endpoints

- `GET /api/integrations/ad360/test` → `{ ok: boolean, error?: string }`
- `GET /api/integrations/ad360/users?fields=...&filter=...` → merged paginated response `{ data: Ad360User[] }` (backend hides AD pagination)
- `GET /api/integrations/ad360/groups?fields=...&filter=...` → `{ data: Ad360Group[] }`
- `GET /api/integrations/ad360/computers?fields=...&filter=...` → `{ data: Ad360Computer[] }`
- `GET /api/integrations/ad360/summary` → derived posture metrics

## Summary shape

```json
{
  "users": { "total": 1234, "disabled": 12, "lockedOut": 3, "neverExpiringPassword": 45 },
  "privilegedUsers": { "count": 8, "samNames": ["..."] },
  "staleAccounts": { "count": 17, "samNames": ["..."] },
  "computers": { "total": 530, "bitlockerEnabledPct": 87.4, "osDistribution": { "Windows 11": 410, "Windows Server 2019": 120 } }
}
```

## Frontend fallback requirement

Until this backend proxy is deployed, frontend must handle `404` gracefully and display:

`Backend proxy not yet deployed — see docs/integrations/ad360/backend-proxy-spec.md`
