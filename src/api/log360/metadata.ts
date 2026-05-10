import type { Log360User, LogField } from './types';
import type { Log360ApiClient } from './client';

function asUsers(payload: unknown): Log360User[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const response = obj.response as Record<string, unknown> | undefined;
  if (response && Array.isArray(response.users)) return response.users as Log360User[];
  return [];
}

function asLogFields(payload: unknown): LogField[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const response = obj.response as Record<string, unknown> | undefined;
  if (response && Array.isArray(response.log_fields)) return response.log_fields as LogField[];
  return [];
}

export function createMetadataApi(client: Log360ApiClient) {
  return {
    async getLogFields(): Promise<LogField[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/metadata/log-fields');
      return asLogFields(payload);
    },

    async getUsers(): Promise<Log360User[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/metadata/users');
      return asUsers(payload);
    },

    async getCurrentUser(): Promise<Log360User | null> {
      const users = await this.getUsers();
      return users[0] ?? null;
    },
  };
}
