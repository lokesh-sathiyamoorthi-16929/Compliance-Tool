// TODO: move to backend proxy for CORS/secret safety
import alertsFixture from './__fixtures__/alerts.json';
import agentsFixture from './__fixtures__/agents.json';
import incidentsFixture from './__fixtures__/incidents.json';
import jobsResultsFixture from './__fixtures__/jobs-results.json';
import logFieldsFixture from './__fixtures__/metadata-log-fields.json';
import usersFixture from './__fixtures__/metadata-users.json';
import logSourcesFixture from './__fixtures__/log-sources.json';
import reportDataFixture from './__fixtures__/report-data.json';
import reportProfilesFixture from './__fixtures__/reports-profiles.json';
import { Log360AuthManager } from './auth';
import type {
  DebugApiCall,
  Log360ApiError,
  Log360ConnectionConfig,
  PaginationInput,
} from './types';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRY_ATTEMPTS = 2;

const debugCalls: DebugApiCall[] = [];

function isMockEnabled(config?: Partial<Log360ConnectionConfig>): boolean {
  if (import.meta.env.VITE_LOG360_MOCK === 'true') return true;
  return !config?.baseUrl;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function pushDebugCall(entry: DebugApiCall): void {
  debugCalls.unshift(entry);
  if (debugCalls.length > 20) {
    debugCalls.length = 20;
  }
}

function asApiError(error: unknown, fallbackStatus?: number): Log360ApiError {
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    const nested = obj.error as Record<string, unknown> | undefined;
    const codeValue = nested?.code ?? obj.code ?? undefined;
    return {
      code: typeof codeValue === 'string' ? codeValue : undefined,
      title: String(nested?.title ?? obj.title ?? 'Log360 API error'),
      detail: String(nested?.detail ?? obj.detail ?? 'Request failed'),
      httpStatus: fallbackStatus,
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Log360 API error',
      detail: error.message,
      httpStatus: fallbackStatus,
    };
  }

  return {
    title: 'Log360 API error',
    detail: 'Unknown error',
    httpStatus: fallbackStatus,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withPagination<T extends Record<string, unknown>>(query: T, page: PaginationInput | undefined): T {
  if (!page) return query;
  return {
    ...query,
    from: page.from,
    limit: page.limit,
  };
}

export function getLog360DebugCalls(): DebugApiCall[] {
  return [...debugCalls];
}

export async function* paginate<T>(
  fetcher: (page: PaginationInput) => Promise<{ items: T[]; total?: number }>,
  input: PaginationInput = {},
): AsyncGenerator<T[], void, void> {
  const limit = input.limit ?? 50;
  let from = input.from ?? 0;

  while (true) {
    const result = await fetcher({ from, limit });
    if (!result.items.length) {
      return;
    }

    yield result.items;

    from += limit;
    if (typeof result.total === 'number' && from >= result.total) {
      return;
    }
  }
}

export class Log360ApiClient {
  readonly config?: Log360ConnectionConfig;

  private readonly authManager?: Log360AuthManager;

  constructor(config?: Log360ConnectionConfig) {
    this.config = config
      ? {
          ...config,
          baseUrl: normalizeBaseUrl(config.baseUrl),
        }
      : undefined;

    if (this.config && !isMockEnabled(this.config)) {
      this.authManager = new Log360AuthManager(this.config);
    }
  }

  isMockMode(): boolean {
    return isMockEnabled(this.config);
  }

  private getMockResponse(path: string): unknown {
    if (path.includes('/metadata/users')) return usersFixture;
    if (path.includes('/metadata/log-fields')) return logFieldsFixture;
    if (path.includes('/log-sources/agents')) return agentsFixture;
    if (path.includes('/log-sources')) return logSourcesFixture;
    if (path.includes('/incident')) return incidentsFixture;
    if (path.includes('/alerts/profiles')) return { response: { profiles: [{ profile_id: 'ap-1', name: 'Critical Alerts' }] } };
    if (path.includes('/alerts')) return alertsFixture;
    if (path.includes('/reports/profiles')) return reportProfilesFixture;
    if (path.includes('/reports/') && path.includes('/data')) return reportDataFixture;
    if (path.includes('/jobs/') && path.includes('/results')) return jobsResultsFixture;
    if (path.includes('/jobs/')) return { response: { job_id: 'job-1', status: 'completed' } };
    if (path.includes('/search')) return { response: { job_id: 'job-1', status: 'queued' } };
    if (path.includes('/log-type')) return { response: { log_types: [{ id: 'lt-1', name: 'Windows Security' }] } };
    return { response: {} };
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    if (!this.config) return path;
    const base = `${this.config.baseUrl}${path}`;
    if (!query) return base;

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    return params.toString() ? `${base}?${params.toString()}` : base;
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options?: {
      body?: unknown;
      query?: Record<string, unknown>;
      skipAuth?: boolean;
      retryOnUnauthorized?: boolean;
    },
  ): Promise<T> {
    if (this.isMockMode()) {
      const mock = this.getMockResponse(path) as T;
      pushDebugCall({
        id: `${Date.now()}-${Math.random()}`,
        method,
        path,
        status: 200,
        elapsedMs: 0,
        at: new Date().toISOString(),
      });
      return mock;
    }

    if (!this.config) {
      throw asApiError({ title: 'Configuration missing', detail: 'Log360 is not configured.' });
    }

    const startedAt = performance.now();
    const retryOnUnauthorized = options?.retryOnUnauthorized ?? true;
    let attempts = 0;

    while (attempts < MAX_RETRY_ATTEMPTS) {
      attempts += 1;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const authHeader = options?.skipAuth
          ? undefined
          : await this.authManager?.getValidAccessToken();

        const response = await fetch(this.buildUrl(path, options?.query), {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: `Bearer ${authHeader}` } : {}),
          },
          body: method === 'GET' ? undefined : JSON.stringify(options?.body ?? {}),
          signal: controller.signal,
        });

        pushDebugCall({
          id: `${Date.now()}-${Math.random()}`,
          method,
          path,
          status: response.status,
          elapsedMs: Math.round(performance.now() - startedAt),
          at: new Date().toISOString(),
        });

        if (response.status === 401 && retryOnUnauthorized && this.authManager) {
          await this.authManager.refreshToken(this.authManager.getToken());
          return this.request<T>(method, path, { ...options, retryOnUnauthorized: false });
        }

        if (response.status === 429 && attempts < MAX_RETRY_ATTEMPTS) {
          const retryHeader = response.headers.get('Retry-After');
          const retrySeconds = retryHeader ? Number(retryHeader) : NaN;
          const retryAfter = Number.isFinite(retrySeconds)
            ? retrySeconds * 1000
            : retryHeader
              ? Math.max(0, new Date(retryHeader).getTime() - Date.now())
              : 2000;
          await delay(retryAfter || 2000);
          continue;
        }

        if (!response.ok) {
          let payload: unknown = null;
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
          throw asApiError(payload ?? { detail: `Request failed with ${response.status}` }, response.status);
        }

        if (response.status === 204) {
          return undefined as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        if (attempts >= MAX_RETRY_ATTEMPTS) {
          throw asApiError(error);
        }
        await delay(300 * attempts);
      } finally {
        clearTimeout(timeout);
      }
    }

    throw asApiError({ detail: 'Unexpected request error' });
  }

  listPageQuery<T extends Record<string, unknown>>(query: T, page?: PaginationInput): T {
    return withPagination(query, page);
  }
}

export function createLog360Client(config?: Log360ConnectionConfig): Log360ApiClient {
  return new Log360ApiClient(config);
}
