# Log360 Cloud API — Canonical 49-Endpoint Reference

**Endpoint source: Log360 Cloud API.**  
**On-prem builds may not expose every endpoint listed here.**  
**The client wraps every call with a graceful-degrade pattern (`NOT_AVAILABLE_IN_BUILD`).**

**Source:** Log360 Cloud API tool catalog (49 tools), pasted by human 2026-05-11  
**Base URL:** `http://<log360-host>:8095/api/v2`  
**Frontend access:** All calls are proxied via `${API_BASE}/integrations/log360/proxy<path>`.  
The browser never calls Log360 directly. The backend proxy attaches the stored Log360 auth token server-side.

---

## Authentication

The frontend sends the ComplianceIQ JWT in every request:

```
Authorization: ******
```

The Log360 auth token is managed by the backend and never exposed to the browser.

---

## Full Endpoint Inventory (49 endpoints)

### Metadata

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 1 | `getLogFields` | GET | `/api/v2/meta/log-fields` | Available log field definitions |
| 2 | `getUsers` _(medium-value, skipped v1)_ | GET | `/api/v2/meta/users` | Log360 user list |

### Accounts

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 3 | `getAccounts` _(medium-value, skipped v1)_ | GET | `/api/v2/accounts` | Account list |

### Reports

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 4 | `getReportProfiles` | POST | `/api/v2/report/profiles` | Available report profiles |
| 5 | `getReportData` | POST | `/api/v2/report/data/{report_id}` | Paginated report row data |
| 6 | `createCustomReport` _(write, skipped)_ | POST | `/api/v2/report/custom` | Create custom report |
| 7 | `updateCustomReport` _(write, skipped)_ | PUT | `/api/v2/report/custom/{report_id}` | Update custom report |
| 8 | `deleteCustomReport` _(write, skipped)_ | DELETE | `/api/v2/report/custom/{report_id}` | Delete custom report |

### Log Sources

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 9 | `getLogSources` | GET | `/api/v2/log-sources` | All configured log sources |
| 10 | `getLogSourceGroups` | GET | `/api/v2/log-sources/log-source-groups` | Log source groups |
| 11 | `getAgents` | GET | `/api/v2/log-sources/agents` | Agent list with health |
| 12 | `getDomains` | GET | `/api/v2/log-sources/domains` | Domain list |
| 13 | `getComputers` | GET | `/api/v2/log-sources/computers` | Computer list |
| 14 | `addWindowsLogsources` _(write, skipped)_ | POST | `/api/v2/log-sources/windows` | Add Windows log source |
| 15 | `deleteLogsources` _(write, skipped)_ | DELETE | `/api/v2/log-sources` | Delete log sources |
| 16 | `updateLogsources` _(write, skipped)_ | PUT | `/api/v2/log-sources` | Update log sources |
| 17 | `updateAgents` _(write, skipped)_ | PUT | `/api/v2/log-sources/agents` | Update agents |

### Log Types

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 18 | `getLogTypes` | GET | `/api/v2/log-type` | Available log types |
| 19 | `createLogTypes` _(write, skipped)_ | POST | `/api/v2/log-type` | Create log type |
| 20 | `deleteLogTypes` _(write, skipped)_ | DELETE | `/api/v2/log-type` | Delete log types |
| 21 | `createParserRule` _(write, skipped)_ | POST | `/api/v2/log-type/parser-rule` | Create parser rule |
| 22 | `updateParserRule` _(write, skipped)_ | PUT | `/api/v2/log-type/parser-rule` | Update parser rule |
| 23 | `deleteParserRule` _(write, skipped)_ | DELETE | `/api/v2/log-type/parser-rule` | Delete parser rule |
| 24 | `getParserRules` _(skipped v1)_ | GET | `/api/v2/log-type/parser-rule` | List parser rules |

### Incidents

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 25 | `getIncidents` | GET | `/api/v2/incident` | List incidents |
| 26 | `getIncident(id)` | GET | `/api/v2/incident/{id}` | Single incident (derived) |
| 27 | `createIncident` _(write, skipped)_ | POST | `/api/v2/incident` | Create incident |
| 28 | `updateIncident` _(write, skipped)_ | PUT | `/api/v2/incident/{id}` | Update incident |
| 29 | `deleteIncidents` _(write, skipped)_ | DELETE | `/api/v2/incident` | Delete incidents |
| 30 | `addIncidentToTicket` _(write, skipped)_ | POST | `/api/v2/incident/{id}/ticket` | Link to ticket |

### Alerts

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 31 | `getAlerts` | POST | `/api/v2/alerts` | Alert list (POST with filter body) |
| 32 | `getAlertProfiles` | GET | `/api/v2/alerts/profile` | All alert profiles |
| 33 | `getAlertProfile(id)` ☁️ | GET | `/api/v2/alerts/profile/{profile_id}` | Single profile detail |
| 34 | `disableAlertProfiles` _(write, skipped)_ | PUT | `/api/v2/alerts/profile/disable` | Disable profiles |
| 35 | `enableAlertProfiles` _(write, skipped)_ | PUT | `/api/v2/alerts/profile/enable` | Enable profiles |

### Detection ☁️ (Cloud-only suspect)

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 36 | `getDetections(params)` ☁️ | GET | `/api/v2/detection/detections` | Real detection events |
| 37 | `listDetectionRules(params)` ☁️ | GET | `/api/v2/detection/rules` | Detection rule inventory |
| 38 | `getDetectionDetail(params)` ☁️ | GET | `/api/v2/detection/detection-detail` | Drill-down forensics |
| 39 | `getMitreCatalog()` ☁️ | GET | `/api/v2/detection/mitre` | MITRE ATT&CK coverage |
| 40 | `getTagCatalog` _(medium-value, skipped v1)_ ☁️ | GET | `/api/v2/detection/tags` | Detection tag catalog |

### Rule Library ☁️ (Cloud-only suspect)

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 41 | `getRules(params)` ☁️ | GET | `/api/v2/rule-library/rules` | Rule library |
| 42 | `getRuleCategories()` ☁️ | GET | `/api/v2/rule-library/categories` | Rule categories |
| 43 | `getRuleTuningInsights` _(write, skipped)_ ☁️ | GET | `/api/v2/rule-library/tuning-insights` | Tuning insights |

### Entities / UEBA ☁️ (Cloud-only suspect)

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 44 | `getRiskScoreDetails(params)` ☁️ | GET | `/api/v2/entities/risk-profile` | UEBA risk score |
| 45 | `listEntityAnomalies(params)` ☁️ | GET | `/api/v2/entities/recent-anomalies` | Recent anomalies |
| 46 | `listRuleAnomalies(params)` ☁️ | GET | `/api/v2/entities/anomaly-details` | Per-rule anomaly detail |

### Threat Intelligence ☁️ (Cloud-only suspect)

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 47 | `virustotalSearch` _(medium-value, skipped v1)_ ☁️ | POST | `/api/v2/threat/search/virustotal` | VirusTotal lookup |
| 48 | `advancedThreatAnalyticsSearch` _(medium-value, skipped v1)_ ☁️ | POST | `/api/v2/threat/search/advanced-threat-analytics` | ATA search |

### Search

| # | Method | HTTP | Path | Notes |
|---|--------|------|------|-------|
| 49 | `simpleSearch(payload)` ☁️ | POST | `/api/v2/search` | Ad-hoc log search |
| 50 | `aggregatedSearch(payload)` ☁️ | POST | `/api/v2/search/aggregate` | Faceted analytics |

> **Note:** The canonical catalog has 49 tools. The table above numbers 50 rows because `getIncident(id)` (#26) is a derived single-get call on top of the list endpoint — both share the same Log360 API path but count as one canonical tool.

---

## ☁️ Cloud-only Suspect Endpoints

The following endpoints are marked ☁️ because they appear in the Log360 **Cloud** API catalog and may **not** be available in on-prem Log360 builds:

- All endpoints under `/api/v2/detection/…`
- All endpoints under `/api/v2/rule-library/…`
- All endpoints under `/api/v2/entities/…`
- All endpoints under `/api/v2/threat/…`
- `/api/v2/search` and `/api/v2/search/aggregate`
- `getAlertProfile(id)` at `/api/v2/alerts/profile/{profile_id}`

The client handles these gracefully: a 404 or 501 from the upstream is mapped to `NOT_AVAILABLE_IN_BUILD` and the method returns `null` / `[]` instead of throwing, so the UI degrades silently.

---

## Error Handling

The frontend `Log360Client` maps backend proxy errors to typed `Log360ClientError` instances:

| `Log360ErrorKind` | Trigger |
|-------------------|---------|
| `UNAUTHORIZED` | HTTP 401 from backend |
| `NOT_CONFIGURED` | Backend code `LOG360_NOT_CONFIGURED` |
| `NETWORK_ERROR` | Backend codes `LOG360_UNREACHABLE` / `NETWORK_UNREACHABLE` |
| `TIMEOUT` | Backend code `LOG360_TIMEOUT` |
| `BAD_REQUEST` | Backend code `LOG360_INVALID_PATH` or upstream 4xx |
| `SERVER_ERROR` | Upstream 5xx (except 501) |
| `NOT_AVAILABLE_IN_BUILD` | Upstream 404 or 501 (Cloud-only endpoint absent in on-prem build) |
| `UNKNOWN` | Any other unexpected error |
