import type { Alert, AlertProfile, PaginationInput } from './types';
import type { Log360ApiClient } from './client';

function asList<T>(payload: unknown, key: string): T[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const response = obj.response as Record<string, unknown> | undefined;

  if (response && Array.isArray(response[key])) return response[key] as T[];
  if (Array.isArray(response)) return response as T[];
  return [];
}

export function createAlertsApi(client: Log360ApiClient) {
  return {
    async list(params: { severity?: string; status?: string; from_time?: string; to_time?: string } & PaginationInput = {}) {
      const query = client.listPageQuery(
        {
          severity: params.severity,
          status: params.status,
          from_time: params.from_time,
          to_time: params.to_time,
        },
        params,
      );
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/alerts', { query });
      const items = asList<Alert>(payload, 'alerts');
      const meta = (payload.meta as { total?: number } | undefined) ?? {};
      return { items, total: meta.total ?? items.length };
    },

    async bulkRequest(payload: Record<string, unknown>) {
      return client.request<{ response?: { request_id?: string } }>('POST', '/api/v2/alerts/bulk/request', { body: payload });
    },

    async bulkFetch(requestId: string) {
      return client.request<Record<string, unknown>>('GET', '/api/v2/alerts/bulk/fetch', { query: { request_id: requestId } });
    },

    async listProfiles(): Promise<AlertProfile[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/alerts/profiles');
      return asList<AlertProfile>(payload, 'profiles');
    },
  };
}
