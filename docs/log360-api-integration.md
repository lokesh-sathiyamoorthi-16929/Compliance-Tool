# Log360 API Integration (Frontend)

## Authentication model

ComplianceIQ uses **Bearer-token-only** authentication for Log360:

- Configure **Server URL** and **Auth Token** on the Connections page.
- Every request sends:

```http
Authorization: Bearer <token>
```

- There is **no OAuth handshake** in the frontend integration.
- There is **no client_id / client_secret / refresh_token** flow.
- Stored browser key: `complianceiq-log360-connection` with `{ baseUrl, token, useProxy, connectedAt }`.

## Sync behavior

- `Test Connection` calls `POST /api/v2/meta/log-fields`.
- `Sync Now` collects evidence from live endpoints and stores it in browser state.
- On failures, UI shows honest `—` values and explicit failure notes (no synthetic fallback numbers).
- Use the **Sync Diagnostics** panel on Connections for endpoint-level status, latency, and summaries.

## Mock fixture behavior

- Fixtures are only used when `VITE_LOG360_MOCK=true`.
- Fixture source: `src/api/log360/__fixtures__/sampleEvidence.ts`.
- When fixture mode is active, UI is labeled `Sample data`.
- Connected mode never auto-falls back to fixtures on API failure.

## Reference

- Detailed endpoint reference: [docs/integrations/log360-v2-api-reference.md](./integrations/log360-v2-api-reference.md)
- Official API docs: https://www.manageengine.com/products/eventlog/api/v2/
