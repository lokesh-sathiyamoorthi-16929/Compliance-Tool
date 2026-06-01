# Log360 Client — Endpoint Coverage

**Endpoint source: Log360 Cloud API.**  
**On-prem builds may not expose every endpoint listed here.**  
**The client wraps every call with a graceful-degrade pattern (`NOT_AVAILABLE_IN_BUILD`).**

See [`api-reference.md`](./api-reference.md) for the full 49-endpoint inventory.

---

## Implemented (25 endpoints / methods)

These 25 client methods are implemented in `src/services/log360Client.ts`:

| # | Method | HTTP | Path | Compliance value |
|---|--------|------|------|-----------------|
| 1 | `getLogFields` | GET | `/api/v2/meta/log-fields` | Schema discovery |
| 2 | `getReportProfiles` | POST | `/api/v2/report/profiles` | Report inventory |
| 3 | `getReportData` | POST | `/api/v2/report/data/{report_id}` | Report row data |
| 4 | `getLogSources` | GET | `/api/v2/log-sources` | Source inventory |
| 5 | `getLogSourceGroups` | GET | `/api/v2/log-sources/log-source-groups` | Group inventory |
| 6 | `getAgents` | GET | `/api/v2/log-sources/agents` | Agent health |
| 7 | `getDomains` | GET | `/api/v2/log-sources/domains` | Domain list |
| 8 | `getComputers` | GET | `/api/v2/log-sources/computers` | Computer list |
| 9 | `getLogTypes` | GET | `/api/v2/log-type` | Log type catalog |
| 10 | `getIncidents` | GET | `/api/v2/incident` | Incident list |
| 11 | `getIncident(id)` | GET | `/api/v2/incident/{id}` | Single incident (derived) |
| 12 | `getAlerts` | POST | `/api/v2/alerts` | Alert list |
| 13 | `getAlertProfiles` | GET | `/api/v2/alerts/profile` | Alert profile list |
| 14 | `getDetections(params)` ☁️ | GET | `/api/v2/detection/detections` | HIPAA 164.308(a)(1)(ii)(D), ISO A.5.25 |
| 15 | `listDetectionRules(params)` ☁️ | GET | `/api/v2/detection/rules` | Detection-rule coverage breadth |
| 16 | `getDetectionDetail(params)` ☁️ | GET | `/api/v2/detection/detection-detail` | Drill-down forensics |
| 17 | `getMitreCatalog()` ☁️ | GET | `/api/v2/detection/mitre` | MITRE ATT&CK coverage |
| 18 | `getRules(params)` ☁️ | GET | `/api/v2/rule-library/rules` | Rule library inventory |
| 19 | `getRuleCategories()` ☁️ | GET | `/api/v2/rule-library/categories` | Rule category posture |
| 20 | `getRiskScoreDetails(params)` ☁️ | GET | `/api/v2/entities/risk-profile` | UEBA risk score |
| 21 | `listEntityAnomalies(params)` ☁️ | GET | `/api/v2/entities/recent-anomalies` | Anomaly volume |
| 22 | `listRuleAnomalies(params)` ☁️ | GET | `/api/v2/entities/anomaly-details` | Per-rule anomaly drill-down |
| 23 | `getAlertProfile(id)` ☁️ | GET | `/api/v2/alerts/profile/{profile_id}` | Per-profile details |
| 24 | `simpleSearch(payload)` ☁️ | POST | `/api/v2/search` | Ad-hoc log search for audit evidence |
| 25 | `aggregatedSearch(payload)` ☁️ | POST | `/api/v2/search/aggregate` | Faceted analytics |

☁️ = Cloud-only suspect — gracefully degrades to `null` / `[]` when endpoint returns 404 or 501.

---

## Medium-value — Skipped in v1 (rationale: low compliance ROI vs. risk)

| Method | HTTP | Path | Reason skipped |
|--------|------|------|----------------|
| `getUsers` | GET | `/api/v2/meta/users` | AD360 already covers user enumeration; duplication without added compliance value |
| `getAccounts` | GET | `/api/v2/accounts` | Account-level data available from other sources; low v1 priority |
| `getTagCatalog` ☁️ | GET | `/api/v2/detection/tags` | Tag metadata; no direct compliance mapping in v1 |
| `virustotalSearch` ☁️ | POST | `/api/v2/threat/search/virustotal` | External threat intel; out-of-scope for v1 scoring |
| `advancedThreatAnalyticsSearch` ☁️ | POST | `/api/v2/threat/search/advanced-threat-analytics` | ATA correlation; deferred to v2 |
| `getParserRules` | GET | `/api/v2/log-type/parser-rule` | Parser config; operational, not compliance-facing |
| `getRuleTuningInsights` ☁️ | GET | `/api/v2/rule-library/tuning-insights` | Tuning advisory; no scoring hook in v1 |

---

## Not Implemented — Write / Admin Actions (intentional, permanent for v1)

ComplianceIQ is **read-only** against Log360 for v1 (same policy as AD360). Write actions require a separate scope review before they can be added.

| Method | HTTP | Path |
|--------|------|------|
| `createIncident` | POST | `/api/v2/incident` |
| `updateIncident` | PUT | `/api/v2/incident/{id}` |
| `deleteIncidents` | DELETE | `/api/v2/incident` |
| `addIncidentToTicket` | POST | `/api/v2/incident/{id}/ticket` |
| `addWindowsLogsources` | POST | `/api/v2/log-sources/windows` |
| `deleteLogsources` | DELETE | `/api/v2/log-sources` |
| `updateLogsources` | PUT | `/api/v2/log-sources` |
| `updateAgents` | PUT | `/api/v2/log-sources/agents` |
| `createLogTypes` | POST | `/api/v2/log-type` |
| `deleteLogTypes` | DELETE | `/api/v2/log-type` |
| `createParserRule` | POST | `/api/v2/log-type/parser-rule` |
| `updateParserRule` | PUT | `/api/v2/log-type/parser-rule` |
| `deleteParserRule` | DELETE | `/api/v2/log-type/parser-rule` |
| `disableAlertProfiles` | PUT | `/api/v2/alerts/profile/disable` |
| `enableAlertProfiles` | PUT | `/api/v2/alerts/profile/enable` |
| `createCustomReport` | POST | `/api/v2/report/custom` |
| `updateCustomReport` | PUT | `/api/v2/report/custom/{report_id}` |
| `deleteCustomReport` | DELETE | `/api/v2/report/custom/{report_id}` |

---

## Graceful Degradation — `NOT_AVAILABLE_IN_BUILD`

The Cloud-only endpoints (☁️) use `requestWithBuildFallback<T>()`, a private helper that:

1. Calls the upstream endpoint normally.
2. If the upstream returns HTTP **404** or **501**, `mapProxyError` classifies the error as `NOT_AVAILABLE_IN_BUILD`.
3. `requestWithBuildFallback` catches that kind and returns `null` instead of throwing.
4. Each public method converts `null` to an appropriate empty response (`[]` for lists, `null` for single items).

This means on-prem Log360 users who lack these endpoints will see "no data" in the UI rather than an error page.
