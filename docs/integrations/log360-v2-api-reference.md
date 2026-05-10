# Log360 v2 API Reference

> **All endpoints below are reached via `${API_BASE}/integrations/log360/proxy<path>`.  
> The browser never calls Log360 directly.**  
>
> Example: `GET /api/v2/log-sources` → frontend calls  
> `GET ${API_BASE}/integrations/log360/proxy/api/v2/log-sources`  
>
> The backend proxy attaches the stored Log360 auth token server-side before forwarding.

---

## Authentication

The frontend attaches the **ComplianceIQ JWT** (not the Log360 token) in every request:

```
Authorization: Bearer <complianceiq-access-token>
```

The Log360 token is managed by the backend and never sent to the browser.

---

## Log Fields

### `GET /api/v2/meta/log-fields`

Returns available log field definitions for building queries. No request body.

**Response:**
```json
{
  "response": {
    "log_fields": [
      { "field_name": "host", "display_name": "Host", "data_type": "string" },
      ...
    ]
  }
}
```

### `GET /api/v2/meta/users`

Returns the list of users available in Log360.

---

## Log Sources

### `GET /api/v2/log-sources`

Lists all configured log sources.

### `GET /api/v2/log-sources/log-source-groups`

Lists log source groups.

### `GET /api/v2/log-sources/agents`

Lists Log360 agents with health status.

### `GET /api/v2/log-sources/domains`

Lists monitored domains.

### `GET /api/v2/log-sources/computers`

Lists monitored computers.

---

## Reports

### `POST /api/v2/report/profiles`

Lists available report profiles. Supports filtering by `module_name`, `category_name`, `group_name`, `report_id`. Pagination via `from` and `limit`.

**Response:**
```json
{
  "response": {
    "modules": [
      {
        "module_name": "Windows",
        "categories": [
          {
            "category_name": "Logon Activity",
            "groups": [
              {
                "group_name": "Logon Reports",
                "reports": [
                  { "report_id": "r1", "report_name": "Successful Logons", "unique_key": "windows_logon_success" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### `POST /api/v2/report/data/{reportId}`

Fetches report data for the given report ID within a time window.

**Request body:**
```json
{
  "start_time": "2026-05-01T00:00:00Z",
  "end_time": "2026-05-10T00:00:00Z",
  "log_source_ids": ["ls1"],
  "log_source_group_ids": [],
  "cursor": null
}
```

**Response:**
```json
{
  "response": [ { "event_time": "2026-05-09T12:00:00Z", "host": "dc01", ... } ],
  "meta": { "total_items": 1000, "items_in_current_page": 100, "cursor": "tok123" }
}
```

---

## Incidents

### `GET /api/v2/incident`

Lists incidents. Optional query param: `response_type=client|server`.

### `GET /api/v2/incident/{id}`

Gets a single incident by ID.

---

## Alerts

### `POST /api/v2/alerts`

Returns active alerts. Pass an empty body `{}` for an unfiltered list; filter fields (severity, time range) can be added to the request body.

### `POST /api/v2/alerts/bulk`

Bulk alert operations.

### `GET /api/v2/alerts/bulk`

Returns bulk alert results.

### `GET /api/v2/alerts/profile`

Returns alert profile metadata.

---

## Log Types

### `GET /api/v2/log-type`

Returns configured log type definitions.

---

## Error Responses

When the backend proxy cannot forward the request, it returns a structured error:

| Status | Error code | Meaning |
|--------|------------|---------|
| 409 | `LOG360_NOT_CONFIGURED` | No credentials saved — go to Connections page |
| 502 | `LOG360_UNREACHABLE` | Backend cannot reach Log360 (network error) |
| 504 | `LOG360_TIMEOUT` | Log360 did not respond within 30s |
| 400 | `LOG360_INVALID_PATH` | Path outside `/api/v2/` (developer error) |
| 401 | `UNAUTHORIZED` | ComplianceIQ session expired |

Upstream 4xx/5xx from Log360 are passed through verbatim (e.g., `401` from Log360 = bad token).
