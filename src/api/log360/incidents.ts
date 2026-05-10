import type { CreateIncidentRequest, Incident, PaginationInput } from './types';
import type { Log360ApiClient } from './client';

function asIncidentList(payload: unknown): Incident[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const response = obj.response as Record<string, unknown> | undefined;

  if (response && Array.isArray(response.incidents)) return response.incidents as Incident[];
  if (Array.isArray(response)) return response as Incident[];
  if (Array.isArray(obj.incidents)) return obj.incidents as Incident[];
  return [];
}

export function createIncidentsApi(client: Log360ApiClient) {
  return {
    async list(params: {
      status?: Incident['status'];
      severity?: Incident['severity'];
      assignee?: string;
      from_time?: string;
      to_time?: string;
    } & PaginationInput = {}) {
      const query = client.listPageQuery(
        {
          status: params.status,
          severity: params.severity,
          assignee: params.assignee,
          from_time: params.from_time,
          to_time: params.to_time,
        },
        params,
      );

      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/incident', { query });
      const items = asIncidentList(payload);
      const meta = (payload.meta as { total?: number } | undefined) ?? {};
      return { items, total: meta.total ?? items.length };
    },

    async get(incidentId: string): Promise<Incident | null> {
      const payload = await client.request<Record<string, unknown>>('GET', `/api/v2/incident/${encodeURIComponent(incidentId)}`);
      const list = asIncidentList(payload);
      if (list.length) return list[0];

      const response = (payload.response as Incident | undefined) ?? null;
      return response;
    },

    async create(payload: CreateIncidentRequest) {
      return client.request<{ response?: Incident }>('POST', '/api/v2/incident', { body: payload });
    },

    async update(payload: Partial<Incident> & { incident_id: string }) {
      return client.request('PUT', '/api/v2/incident', { body: payload });
    },

    async remove(incidentIds: string[]) {
      return client.request('DELETE', '/api/v2/incident', { body: { incident_ids: incidentIds } });
    },
  };
}
