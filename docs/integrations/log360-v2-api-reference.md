# Log360 v2 API Reference

> **All endpoints below are reached via `${API_BASE}/integrations/log360/proxy<path>`.  
> The browser never calls Log360 directly.**  
>
> Example: `GET /api/v2/log-sources` → frontend calls  
> `GET ${API_BASE}/integrations/log360/proxy/api/v2/log-sources`  
>
> The backend proxy attaches the stored Log360 auth token server-side before forwarding.
>
> This document lists the Log360 v2 endpoints used by ComplianceIQ. Retention/archive settings are intentionally not consumed because no public v2 endpoint exposes them — fabricating a value would violate our "no fake data" rule.

---

## Authentication

The frontend attaches the **ComplianceIQ JWT** (not the Log360 token) in every request:

```
Authorization: Bearer <complianceiq-access-token>
```

The Log360 token is managed by the backend and never sent to the browser.

---

## Metadata

### `GET /api/v2/meta/log-fields`

Returns available log field definitions for building queries.

This request is a `GET` with no request body.

### `GET /api/v2/meta/users`

Returns metadata user records that can be referenced in filters.

**Response:**
```json
{
  "response": {
    "users": [
      { "user_id": "u1", "user_name": "admin" }
    ]
  }
}
```

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

Returns active alerts.

**Request body (example):**
```json
{
  "from": 0,
  "limit": 100
}
```

**Response (example):**
```json
{
  "response": [
    { "id": "a1", "severity": "high", "status": "open", "title": "Suspicious login" }
  ]
}
```

### `GET /api/v2/alerts/profile`

Returns alert profile metadata used for response signal calculations.

**Response (example):**
```json
{
  "response": [
    { "profile_id": "p1", "name": "Critical Alert Profile", "enabled": true }
  ]
}
```

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
