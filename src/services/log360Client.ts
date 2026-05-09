export interface Log360ClientConfig {
  baseUrl: string;
  token: string;
  useProxy?: boolean;
}

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
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
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

export interface IncidentListParams {
  response_type?: 'client' | 'server';
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  fieldCount?: number;
  error?: string;
}

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;
const MAX_BACKOFF_MS = 2_000;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const candidate of ['items', 'data', 'log_sources', 'groups', 'agents', 'incidents', 'alerts']) {
      if (Array.isArray(obj[candidate])) {
        return obj[candidate] as T[];
      }
    }
  }
  return [];
}

function isLikelyCorsOrNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

export class Log360Client {
  private baseUrl: string;

  private token: string;

  private useProxy: boolean;

  constructor(config: Log360ClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.token = config.token;
    this.useProxy = Boolean(config.useProxy);
  }

  setProxyEnabled(enabled: boolean): void {
    this.useProxy = enabled;
  }

  async getLogFields(): Promise<LogField[]> {
    const response = await this.request<LogFieldsResponse>('POST', '/api/v2/meta/log-fields', {});
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
    return this.request<AlertsResponse>('GET', '/api/v2/alerts');
  }

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
        error: this.toFriendlyErrorMessage(error),
      };
    }
  }

  private buildRequestUrl(path: string): string {
    const target = `${this.baseUrl}${path}`;
    if (!this.useProxy) {
      return target;
    }
    return `/api/proxy?target=${encodeURIComponent(target)}`;
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(this.buildRequestUrl(path), {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Log360ClientError(
            'UNAUTHORIZED',
            'Invalid or missing AuthToken. Please verify your bearer token.',
            401,
            '07001113',
          );
        }

        if (response.status >= 500) {
          if (attempt < MAX_RETRIES) {
            attempt += 1;
            const delay = Math.min(MAX_BACKOFF_MS, 400 * (2 ** (attempt - 1)));
            await sleep(delay);
            continue;
          }

          const payload = await this.safeParseErrorPayload(response);
          throw new Log360ClientError(
            'SERVER_ERROR',
            payload.error?.detail ?? payload.detail ?? payload.error?.title ?? payload.title ?? 'Server error from Log360.',
            response.status,
            payload.error?.code ?? payload.code,
          );
        }

        if (!response.ok) {
          const payload = await this.safeParseErrorPayload(response);
          throw new Log360ClientError(
            'BAD_REQUEST',
            payload.error?.detail ?? payload.detail ?? payload.error?.title ?? payload.title ?? `Log360 API request failed (${response.status}).`,
            response.status,
            payload.error?.code ?? payload.code,
          );
        }

        if (response.status === 204) {
          return undefined as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof Log360ClientError) {
          throw error;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Log360ClientError('TIMEOUT', 'Request to Log360 timed out after 30 seconds.');
        }

        if (isLikelyCorsOrNetworkError(error)) {
          throw new Log360ClientError(
            'NETWORK_ERROR',
            'Cannot reach Log360 server. The server may be down or blocked by CORS. Set up proxy and retry.',
          );
        }

        throw new Log360ClientError('UNKNOWN', 'Unexpected Log360 API error.');
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new Log360ClientError('UNKNOWN', 'Unexpected Log360 API retry failure.');
  }

  private async safeParseErrorPayload(response: Response): Promise<Log360ApiErrorPayload> {
    try {
      return (await response.json()) as Log360ApiErrorPayload;
    } catch {
      return {};
    }
  }

  private toFriendlyErrorMessage(error: unknown): string {
    if (!(error instanceof Log360ClientError)) {
      return 'Connection test failed.';
    }

    if (error.kind === 'UNAUTHORIZED') {
      return 'Invalid or expired token';
    }

    if (error.kind === 'NETWORK_ERROR') {
      return 'Cannot reach server / CORS blocked';
    }

    if (error.kind === 'SERVER_ERROR') {
      return 'Server error';
    }

    return error.message;
  }
}
