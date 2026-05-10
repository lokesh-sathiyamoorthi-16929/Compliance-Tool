import type { Agent, Computer, Domain, LogSource, LogSourceGroup, PaginationInput } from './types';
import type { Log360ApiClient } from './client';

function asList<T>(payload: unknown, keys: string[]): T[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const root = obj.response && typeof obj.response === 'object' ? obj.response as Record<string, unknown> : obj;

  for (const key of keys) {
    const value = root[key];
    if (Array.isArray(value)) return value as T[];
  }

  if (Array.isArray(root)) return root as T[];
  return [];
}

export function createLogSourcesApi(client: Log360ApiClient) {
  return {
    async list(params: { type?: string; domain?: string; agent?: string } & PaginationInput = {}) {
      const query = client.listPageQuery(
        {
          type: params.type,
          domain: params.domain,
          agent: params.agent,
        },
        params,
      );

      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/log-sources', { query });
      const items = asList<LogSource>(payload, ['log_sources', 'items', 'data']);
      const meta = (payload.meta as { total?: number } | undefined) ?? {};
      return { items, total: meta.total ?? items.length };
    },

    async addWindows(logSources: Array<Record<string, unknown>>) {
      return client.request('POST', '/api/v2/log-sources/windows', { body: { log_sources: logSources } });
    },

    async removeWindows(deletePayload: Record<string, unknown>) {
      return client.request('DELETE', '/api/v2/log-sources/windows', { body: deletePayload });
    },

    async update(payload: Record<string, unknown>) {
      return client.request('PUT', '/api/v2/log-sources', { body: payload });
    },

    async updateWindowsEventSourceConfiguration(payload: Record<string, unknown>) {
      return client.request('PUT', '/api/v2/log-sources/windows/event-source-configuration', { body: payload });
    },

    async listGroups(): Promise<LogSourceGroup[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/log-sources/log-source-groups');
      return asList<LogSourceGroup>(payload, ['log_source_groups', 'groups', 'items']);
    },

    async listAgents(): Promise<Agent[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/log-sources/agents');
      return asList<Agent>(payload, ['agents', 'items']);
    },

    async addAgent(payload: Record<string, unknown>) {
      return client.request('POST', '/api/v2/log-sources/agents', { body: payload });
    },

    async updateAgent(payload: Record<string, unknown>) {
      return client.request('PUT', '/api/v2/log-sources/agents', { body: payload });
    },

    async listDomains(): Promise<Domain[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/log-sources/domains');
      return asList<Domain>(payload, ['domains', 'items']);
    },

    async listComputers(): Promise<Computer[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/log-sources/computers');
      return asList<Computer>(payload, ['computers', 'items']);
    },
  };
}
