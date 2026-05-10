# Log360 v2 API Reference (Used by ComplianceIQ)

This is the authoritative list of **Log360 v2 endpoints currently called by the frontend app**.

## Auth

- **Auth scheme:** `Authorization: Bearer <token>` on every request.
- **No OAuth handshake in app:** no `/api/v2/oauth/token`, no refresh flow.
- Token is provisioned externally by Log360 administrators.

Source docs: https://www.manageengine.com/products/eventlog/api/v2/

## Endpoints called by the app

### 1) Test Connection

#### `POST /api/v2/meta/log-fields`
- **Where used:** Connections → Test Connection.
- **Request body schema:** `{}` (empty object)
- **Response schema (used fields):**
  - `response.log_fields: Array<{ field_name: string; ... }>`
- **Scope:** token must allow metadata read access.

---

### 2) Evidence Sync

#### `GET /api/v2/log-sources`
- **Used for:** source coverage and source inventory.
- **Response schema (used fields):**
  - list entries like `{ id?: string; name?: string; log_type?: string; status?: string; ... }`
- **Scope:** log source read access.

#### `GET /api/v2/log-sources/log-source-groups`
- **Used for:** source group evidence.
- **Response schema (used fields):**
  - list entries like `{ id?: string; name?: string; member_count?: number; log_source_ids?: string[]; ... }`
- **Scope:** log source group read access.

#### `GET /api/v2/log-sources/agents`
- **Used for:** agent health evidence.
- **Response schema (used fields):**
  - list entries like `{ id?: string; name?: string; status?: string; health_status?: string; ... }`
- **Scope:** agent read access.

#### `POST /api/v2/report/profiles`
- **Used for:** report catalog discovery.
- **Request body schema (app):**
  - `{ from?: number; limit?: number; module_name?: string; category_name?: string; group_name?: string; report_id?: string }`
- **Response schema (used fields):**
  - `response.modules[].categories[].groups[].reports[]`
  - report fields used: `report_id`, `report_name`, `unique_key`
- **Scope:** report profile read access.

#### `POST /api/v2/report/data/{reportId}`
- **Used for:** sampled report evidence rows for curated keys.
- **Request body schema (app):**
  - `{ start_time: string; end_time: string; log_source_ids?: string[]; log_source_group_ids?: string[]; cursor?: string }`
- **Response schema (used fields):**
  - `response: Array<object>`
  - `meta.total_items?: number`
  - `meta.items_in_current_page?: number`
- **Scope:** report data read access.

#### `GET /api/v2/incident?response_type=client`
- **Used for:** incident response and detection metrics.
- **Response schema (used fields):**
  - list entries like `{ incident_id?: string; status?: string; severity?: string; created_time?: string; ... }`
- **Scope:** incident read access.

#### `GET /api/v2/alerts`
- **Used for:** detection activity metrics.
- **Response schema (used fields):**
  - app currently uses array length from `response`.
- **Scope:** alert read access.

## Error handling contract in UI

For each metric derived from these endpoints:
- **Success:** show real collected value.
- **Failure:** show `—` with `Failed: <status/reason>`.
- **404:** show `Not available on this Log360 build`.
- **Not collected yet:** show `—` and `Not collected yet`.

## Related docs

- Integration implementation notes: [../log360-api-integration.md](../log360-api-integration.md)
