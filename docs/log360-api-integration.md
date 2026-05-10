# Log360 v2 API integration

## Connection setup

1. Open **Connections** page.
2. Enter:
   - Server URL (for example `http://lokesh-16929-t:8095`)
   - Client ID
   - Client Secret
   - Refresh Token
3. Click **Test Connection**.
4. On success, configuration is persisted in browser localStorage (base64-obfuscated only).

> ⚠️ Browser storage is not encrypted at rest. This is for local demo usage only.

### OAuth notes

ComplianceIQ uses Log360/EventLog Analyzer v2 OAuth endpoints:
- `POST /api/v2/oauth/token`
- `POST /api/v2/oauth/refresh`

All API requests include `Authorization: Bearer <token>`.

## Real evidence coverage

Currently wired to live Log360 evidence:
- **HIPAA 164.312(b) Audit Controls**
  - Log-source in-scope host coverage (`/api/v2/log-sources`)
  - Retention-days evidence from report profiles (`/api/v2/reports/profiles`)
- **PCI DSS 10.2**
  - Validates presence of Windows + database + network log-source types (`/api/v2/log-sources`)

Still mocked/heuristic in this phase:
- Some controls outside these mappings continue using existing evidence heuristics/manual attestations.

## Dashboard live KPIs

When Log360 is connected, KPI cards are live:
- Log Sources Configured
- Agents Online
- Open Incidents (last 30d)
- Critical Alerts (last 7d)
- Reports Available

If not connected (or `VITE_LOG360_MOCK=true`), sample data is shown.

## Troubleshooting

- **401 Unauthorized**: verify client credentials and refresh token; token is auto-refreshed via `/oauth/refresh`.
- **Rate limit / 429**: client applies retry/backoff using `Retry-After` when available.
- **CORS**: browser-only mode may fail against direct Log360 hosts. Backend proxy is recommended.

## Browser-only caveat

This release uses a browser fetch layer.

Follow-up: move all Log360 calls behind backend proxy for CORS handling and secret safety.

## Screenshots

- _Placeholder_: Connections page configured-state screenshot
- _Placeholder_: Dashboard live KPI cards screenshot
