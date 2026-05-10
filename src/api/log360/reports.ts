import type { PaginationInput, ReportDataResponse, ReportProfile } from './types';
import type { Log360ApiClient } from './client';

function asProfiles(payload: unknown): ReportProfile[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const response = obj.response as Record<string, unknown> | undefined;

  if (response && Array.isArray(response.profiles)) return response.profiles as ReportProfile[];
  if (Array.isArray(response)) return response as ReportProfile[];
  return [];
}

export function createReportsApi(client: Log360ApiClient) {
  return {
    async listProfiles(params: PaginationInput = {}): Promise<ReportProfile[]> {
      const query = client.listPageQuery({}, params);
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/reports/profiles', { query });
      return asProfiles(payload);
    },

    async getReportData(profileId: string, params: { from_time?: string; to_time?: string; limit?: number } = {}): Promise<ReportDataResponse> {
      return client.request<ReportDataResponse>('GET', `/api/v2/reports/${encodeURIComponent(profileId)}/data`, {
        query: {
          from_time: params.from_time,
          to_time: params.to_time,
          limit: params.limit,
        },
      });
    },

    async createCustom(payload: Record<string, unknown>) {
      return client.request('POST', '/api/v2/reports/custom', { body: payload });
    },

    async updateCustom(payload: Record<string, unknown>) {
      return client.request('PUT', '/api/v2/reports/custom', { body: payload });
    },

    async deleteCustom(payload: { profile_id: string }) {
      return client.request('DELETE', '/api/v2/reports/custom', { body: payload });
    },
  };
}
