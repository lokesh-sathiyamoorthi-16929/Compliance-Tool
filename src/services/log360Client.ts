import { apiRequest, ApiError } from '../api/client';

export interface Log360ApiErrorPayload {
  code?: string;
  title?: string;
  detail?: string;
  error?: {
    code?: string;
    title?: string;
    detail?: string;
  };
}

export type Log360ErrorKind =
  | 'UNAUTHORIZED'
  | 'NOT_CONFIGURED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
  | 'NOT_AVAILABLE_IN_BUILD'
  | 'UNKNOWN';

export class Log360ClientError extends Error {
  kind: Log360ErrorKind;
  status?: number;
  code?: string;

  constructor(kind: Log360ErrorKind, message: string, status?: number, code?: string) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

export interface LogField {
  field_name: string;
  display_name?: string;
  data_type?: string;
  category?: string;
  operators?: string[];
  [key: string]: unknown;
}

export interface LogFieldsResponse {
  response?: {
    log_fields?: LogField[];
    [key: string]: unknown;
  };
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ReportProfileFilters {
  module_name?: string;
  category_name?: string;
  group_name?: string;
  report_id?: string;
  from?: number;
  limit?: number;
}

export interface ReportProfile {
  report_id: string;
  report_name: string;
  unique_key?: string;
  report_criteria?: unknown;
  report_type?: string;
  [key: string]: unknown;
}

export interface ReportProfileGroup {
  group_name: string;
  reports: ReportProfile[];
  [key: string]: unknown;
}

export interface ReportProfileCategory {
  category_name: string;
  groups: ReportProfileGroup[];
  [key: string]: unknown;
}

export interface ReportProfileModule {
  module_name: string;
  categories: ReportProfileCategory[];
  [key: string]: unknown;
}

export interface ReportProfileResponse {
  response?: {
    modules?: ReportProfileModule[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ReportDataParams {
  startTime: string;
  endTime: string;
  logSourceIds?: string[];
  logSourceGroupIds?: string[];
  cursor?: string;
}

export interface ReportDataMeta {
  cursor?: string;
  total_items?: number;
  items_in_current_page?: number;
  [key: string]: unknown;
}

export interface ReportDataResponse {
  response?: unknown[] | Record<string, unknown>;
  meta?: ReportDataMeta;
  [key: string]: unknown;
}

export interface LogSource {
  id?: string;
  name?: string;
  log_type?: string;
  status?: string;
  [key: string]: unknown;
}

export interface LogSourceGroup {
  id?: string;
  name?: string;
  member_count?: number;
  log_source_ids?: string[];
  [key: string]: unknown;
}

export interface Agent {
  id?: string;
  name?: string;
  status?: string;
  health_status?: string;
  [key: string]: unknown;
}

export interface Domain {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface Computer {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface LogType {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface Incident {
  incident_id?: string;
  id?: string;
  title?: string;
  status?: string;
  severity?: string;
  created_time?: string;
  updated_time?: string;
  [key: string]: unknown;
}

export interface AlertsResponse {
  response?: unknown;
  [key: string]: unknown;
}

export interface AlertProfile {
  profile_id?: string;
  profile_name?: string;
  severity?: string;
  [key: string]: unknown;
}

export interface AlertProfilesResponse {
  response?: AlertProfile[] | Record<string, unknown>;
  [key: string]: unknown;
}

export interface IncidentListParams {
  response_type?: 'client' | 'server';
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  fieldCount?: number;
  error?: string;
}

// ─── New interfaces for endpoints #14–#25 ────────────────────────────────────

export interface DetectionListParams {
  from?: number;
  limit?: number;
  start_time?: string;
  end_time?: string;
  severity?: string;
  [key: string]: unknown;
}

export interface Detection {
  detection_id?: string;
  name?: string;
  severity?: string;
  detected_at?: string;
  [key: string]: unknown;
}

export interface DetectionRuleListParams {
  from?: number;
  limit?: number;
  category?: string;
  [key: string]: unknown;
}

export interface DetectionRule {
  rule_id?: string;
  rule_name?: string;
  category?: string;
  [key: string]: unknown;
}

export interface DetectionDetailParams {
  detection_id?: string;
  [key: string]: unknown;
}

export interface MitreTechnique {
  technique_id?: string;
  technique_name?: string;
  tactic?: string;
  [key: string]: unknown;
}

export interface RuleLibraryParams {
  from?: number;
  limit?: number;
  category?: string;
  [key: string]: unknown;
}

export interface RuleLibraryRule {
  rule_id?: string;
  rule_name?: string;
  category?: string;
  [key: string]: unknown;
}

export interface RuleCategory {
  category_id?: string;
  category_name?: string;
  rule_count?: number;
  [key: string]: unknown;
}

export interface EntityRiskProfileParams {
  entity_id?: string;
  entity_type?: string;
  [key: string]: unknown;
}

export interface EntityRiskProfile {
  entity_id?: string;
  entity_name?: string;
  risk_score?: number;
  risk_level?: string;
  [key: string]: unknown;
}

export interface EntityAnomalyParams {
  entity_id?: string;
  from?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface EntityAnomaly {
  anomaly_id?: string;
  anomaly_name?: string;
  entity_id?: string;
  detected_at?: string;
  [key: string]: unknown;
}

export interface RuleAnomalyParams {
  rule_id?: string;
  from?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface RuleAnomaly {
  anomaly_id?: string;
  rule_id?: string;
  entity_id?: string;
  detected_at?: string;
  [key: string]: unknown;
}

export interface SearchPayload {
  query: string;
  start_time?: string;
  end_time?: string;
  from?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface SearchResult {
  log_source?: string;
  timestamp?: string;
  message?: string;
  [key: string]: unknown;
}

export interface AggregatedSearchPayload {
  query: string;
  group_by?: string[];
  start_time?: string;
  end_time?: string;
  [key: string]: unknown;
}

export interface AggregatedSearchResult {
  buckets?: unknown[];
  total?: number;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────

const RESPONSE_LIST_KEYS = ['items', 'data', 'log_sources', 'groups', 'agents', 'incidents', 'alerts'] as const;

function extractList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const candidate of RESPONSE_LIST_KEYS) {
      if (Array.isArray(obj[candidate])) {
        return obj[candidate] as T[];
      }
    }
  }
  return [];
}

function getConnectionTestErrorMessage(error: unknown): string {
  if (error instanceof Log360ClientError) {
    return error.message;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Connection test failed.';
}

/**
 * Translates an ApiError thrown by the backend proxy into a typed Log360ClientError.
 * Maps backend-specific error codes (LOG360_NOT_CONFIGURED, LOG360_UNREACHABLE, etc.)
 * to user-readable messages.
 */
function mapProxyError(error: unknown, logicalPath: string): Log360ClientError {
  if (!(error instanceof ApiError)) {
    return new Log360ClientError('UNKNOWN', 'Unexpected Log360 API error.');
  }

  if (error.status === 401) {
    return new Log360ClientError(
      'UNAUTHORIZED',
      'Your ComplianceIQ session expired. Please log in again.',
      401,
    );
  }

  if (error.code === 'LOG360_NOT_CONFIGURED') {
    return new Log360ClientError(
      'NOT_CONFIGURED',
      'No Log360 connection saved. Configure it on the Connections page.',
      409,
      'LOG360_NOT_CONFIGURED',
    );
  }

  if (error.code === 'LOG360_UNREACHABLE') {
    return new Log360ClientError(
      'NETWORK_ERROR',
      'Backend could not reach Log360 server (network error).',
      502,
      'LOG360_UNREACHABLE',
    );
  }

  if (error.code === 'LOG360_TIMEOUT') {
    return new Log360ClientError(
      'TIMEOUT',
      'Log360 did not respond within 30 seconds.',
      504,
      'LOG360_TIMEOUT',
    );
  }

  if (error.code === 'LOG360_INVALID_PATH') {
    if (import.meta.env.DEV) {
      console.error(`[DEV] LOG360_INVALID_PATH for path: ${logicalPath}`);
    }
    return new Log360ClientError(
      'BAD_REQUEST',
      `Invalid Log360 API path: ${logicalPath}`,
      400,
      'LOG360_INVALID_PATH',
    );
  }

  if (error.code === 'NETWORK_UNREACHABLE') {
    return new Log360ClientError(
      'NETWORK_ERROR',
      'Backend is unreachable. Start the API server and try again.',
    );
  }

  // 404 or 501 from upstream Log360 → endpoint not available in this build
  if (error.status === 404 || error.status === 501) {
    return new Log360ClientError(
      'NOT_AVAILABLE_IN_BUILD',
      'This Log360 endpoint is not available in your build (likely Cloud-only). Skipping.',
      error.status,
    );
  }

  // Pass-through upstream 4xx/5xx from Log360
  const kind: Log360ErrorKind = error.status !== undefined && error.status >= 500 ? 'SERVER_ERROR' : 'BAD_REQUEST';
  return new Log360ClientError(kind, error.message, error.status);
}

/**
 * Log360Client routes all requests through the backend proxy
 * at `${API_BASE}/integrations/log360/proxy/api/v2/...`.
 *
 * The ComplianceIQ JWT is attached automatically by apiRequest.
 * The Log360 auth token is managed server-side — the browser never sees it.
 */
export class Log360Client {
  async getLogFields(): Promise<LogField[]> {
    const response = await this.request<LogFieldsResponse>('GET', '/api/v2/meta/log-fields');
    return extractList<LogField>(response.response?.log_fields ?? response.response ?? response);
  }

  async getReportProfiles(filters: ReportProfileFilters = {}): Promise<ReportProfileResponse> {
    return this.request<ReportProfileResponse>('POST', '/api/v2/report/profiles', filters);
  }

  async getReportData(reportId: string, params: ReportDataParams): Promise<ReportDataResponse> {
    const payload = {
      start_time: params.startTime,
      end_time: params.endTime,
      log_source_ids: params.logSourceIds,
      log_source_group_ids: params.logSourceGroupIds,
      cursor: params.cursor,
    };
    return this.request<ReportDataResponse>('POST', `/api/v2/report/data/${encodeURIComponent(reportId)}`, payload);
  }

  async getLogSources(): Promise<LogSource[]> {
    const response = await this.request<Record<string, unknown>>('GET', '/api/v2/log-sources');
    return extractList<LogSource>((response as { response?: unknown }).response ?? response);
  }

  async getLogSourceGroups(): Promise<LogSourceGroup[]> {
    const response = await this.request<Record<string, unknown>>('GET', '/api/v2/log-sources/log-source-groups');
    return extractList<LogSourceGroup>((response as { response?: unknown }).response ?? response);
  }

  async getAgents(): Promise<Agent[]> {
    const response = await this.request<Record<string, unknown>>('GET', '/api/v2/log-sources/agents');
    return extractList<Agent>((response as { response?: unknown }).response ?? response);
  }

  async getDomains(): Promise<Domain[]> {
    const response = await this.request<Record<string, unknown>>('GET', '/api/v2/log-sources/domains');
    return extractList<Domain>((response as { response?: unknown }).response ?? response);
  }

  async getComputers(): Promise<Computer[]> {
    const response = await this.request<Record<string, unknown>>('GET', '/api/v2/log-sources/computers');
    return extractList<Computer>((response as { response?: unknown }).response ?? response);
  }

  async getLogTypes(): Promise<LogType[]> {
    const response = await this.request<Record<string, unknown>>('GET', '/api/v2/log-type');
    return extractList<LogType>((response as { response?: unknown }).response ?? response);
  }

  async getIncidents(params: IncidentListParams = {}): Promise<Incident[]> {
    const query = new URLSearchParams();
    if (params.response_type) {
      query.set('response_type', params.response_type);
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.request<Record<string, unknown>>('GET', `/api/v2/incident${suffix}`);
    return extractList<Incident>((response as { response?: unknown }).response ?? response);
  }

  async getIncident(id: string): Promise<Incident> {
    const response = await this.request<Record<string, unknown>>('GET', `/api/v2/incident/${encodeURIComponent(id)}`);
    const list = extractList<Incident>((response as { response?: unknown }).response ?? response);
    return list[0] ?? (response as Incident);
  }

  async getAlerts(): Promise<AlertsResponse> {
    // TODO: filter shape (severity, time range) can be expanded later; empty body returns unfiltered list per ManageEngine pattern
    return this.request<AlertsResponse>('POST', '/api/v2/alerts', {});
  }

  async getAlertProfiles(): Promise<AlertProfile[]> {
    const response = await this.request<AlertProfilesResponse>('GET', '/api/v2/alerts/profile');
    return extractList<AlertProfile>(response.response ?? response);
  }

  // ─── New endpoints #14–#25 (graceful degradation) ──────────────────────────

  async getDetections(params: DetectionListParams = {}): Promise<Detection[]> {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', `/api/v2/detection/detections${suffix}`);
    if (response === null) return [];
    return extractList<Detection>((response as { response?: unknown }).response ?? response);
  }

  async listDetectionRules(params: DetectionRuleListParams = {}): Promise<DetectionRule[]> {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', `/api/v2/detection/rules${suffix}`);
    if (response === null) return [];
    return extractList<DetectionRule>((response as { response?: unknown }).response ?? response);
  }

  async getDetectionDetail(params: DetectionDetailParams = {}): Promise<Detection | null> {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', `/api/v2/detection/detection-detail${suffix}`);
    if (response === null) return null;
    const list = extractList<Detection>((response as { response?: unknown }).response ?? response);
    return list[0] ?? (response as Detection);
  }

  async getMitreCatalog(): Promise<MitreTechnique[]> {
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', '/api/v2/detection/mitre');
    if (response === null) return [];
    return extractList<MitreTechnique>((response as { response?: unknown }).response ?? response);
  }

  async getRules(params: RuleLibraryParams = {}): Promise<RuleLibraryRule[]> {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', `/api/v2/rule-library/rules${suffix}`);
    if (response === null) return [];
    return extractList<RuleLibraryRule>((response as { response?: unknown }).response ?? response);
  }

  async getRuleCategories(): Promise<RuleCategory[]> {
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', '/api/v2/rule-library/categories');
    if (response === null) return [];
    return extractList<RuleCategory>((response as { response?: unknown }).response ?? response);
  }

  async getRiskScoreDetails(params: EntityRiskProfileParams = {}): Promise<EntityRiskProfile | null> {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', `/api/v2/entities/risk-profile${suffix}`);
    if (response === null) return null;
    const list = extractList<EntityRiskProfile>((response as { response?: unknown }).response ?? response);
    return list[0] ?? (response as EntityRiskProfile);
  }

  async listEntityAnomalies(params: EntityAnomalyParams = {}): Promise<EntityAnomaly[]> {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', `/api/v2/entities/recent-anomalies${suffix}`);
    if (response === null) return [];
    return extractList<EntityAnomaly>((response as { response?: unknown }).response ?? response);
  }

  async listRuleAnomalies(params: RuleAnomalyParams = {}): Promise<RuleAnomaly[]> {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query.set(k, String(v));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', `/api/v2/entities/anomaly-details${suffix}`);
    if (response === null) return [];
    return extractList<RuleAnomaly>((response as { response?: unknown }).response ?? response);
  }

  async getAlertProfile(id: string): Promise<AlertProfile | null> {
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('GET', `/api/v2/alerts/profile/${encodeURIComponent(id)}`);
    if (response === null) return null;
    const list = extractList<AlertProfile>((response as { response?: unknown }).response ?? response);
    return list[0] ?? (response as AlertProfile);
  }

  async simpleSearch(payload: SearchPayload): Promise<SearchResult[]> {
    const response = await this.requestWithBuildFallback<Record<string, unknown>>('POST', '/api/v2/search', payload);
    if (response === null) return [];
    return extractList<SearchResult>((response as { response?: unknown }).response ?? response);
  }

  async aggregatedSearch(payload: AggregatedSearchPayload): Promise<AggregatedSearchResult | null> {
    const response = await this.requestWithBuildFallback<AggregatedSearchResult>('POST', '/api/v2/search/aggregate', payload);
    return response;
  }

  // ─────────────────────────────────────────────────────────────────────────────

  async testConnection(): Promise<TestConnectionResult> {
    const startedAt = performance.now();
    try {
      const fields = await this.getLogFields();
      return {
        success: true,
        latencyMs: Math.round(performance.now() - startedAt),
        fieldCount: fields.length,
      };
    } catch (error) {
      return {
        success: false,
        latencyMs: Math.round(performance.now() - startedAt),
        error: getConnectionTestErrorMessage(error),
      };
    }
  }

  /**
   * All Log360 v2 calls go through the backend proxy.
   * logicalPath: the Log360-facing path, e.g. '/api/v2/log-sources'
   * Proxied to: '/integrations/log360/proxy/api/v2/log-sources'
   */
  private async request<T>(method: 'GET' | 'POST', logicalPath: string, body?: unknown): Promise<T> {
    const proxyPath = `/integrations/log360/proxy${logicalPath}`;
    try {
      return await apiRequest<T>(proxyPath, {
        method,
        body: method === 'POST' ? body : undefined,
      });
    } catch (error) {
      throw mapProxyError(error, logicalPath);
    }
  }

  /**
   * Like request(), but returns null instead of throwing when the upstream
   * returns NOT_AVAILABLE_IN_BUILD (404 or 501).  Used by the new Cloud-only
   * endpoints so callers can treat absence as "no data" rather than an error.
   */
  private async requestWithBuildFallback<T>(method: 'GET' | 'POST', logicalPath: string, body?: unknown): Promise<T | null> {
    try {
      return await this.request<T>(method, logicalPath, body);
    } catch (error) {
      if (error instanceof Log360ClientError && error.kind === 'NOT_AVAILABLE_IN_BUILD') {
        return null;
      }
      throw error;
    }
  }
}
