import type { LogType, ParserRule } from './types';
import type { Log360ApiClient } from './client';

function asList<T>(payload: unknown, key: string): T[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const response = obj.response as Record<string, unknown> | undefined;

  if (response && Array.isArray(response[key])) return response[key] as T[];
  if (Array.isArray(response)) return response as T[];
  return [];
}

export function createLogTypesApi(client: Log360ApiClient) {
  return {
    async list(): Promise<LogType[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/log-type');
      return asList<LogType>(payload, 'log_types');
    },

    async create(payload: Record<string, unknown>) {
      return client.request('POST', '/api/v2/log-type', { body: payload });
    },

    async update(payload: Record<string, unknown>) {
      return client.request('PUT', '/api/v2/log-type', { body: payload });
    },

    async remove(payload: Record<string, unknown>) {
      return client.request('DELETE', '/api/v2/log-type', { body: payload });
    },

    async listParserRules(logTypeId?: string): Promise<ParserRule[]> {
      const payload = await client.request<Record<string, unknown>>('GET', '/api/v2/log-type/parser-rules', {
        query: { log_type_id: logTypeId },
      });
      return asList<ParserRule>(payload, 'parser_rules');
    },

    async createParserRule(payload: Record<string, unknown>) {
      return client.request('POST', '/api/v2/log-type/parser-rules', { body: payload });
    },

    async updateParserRule(payload: Record<string, unknown>) {
      return client.request('PUT', '/api/v2/log-type/parser-rules', { body: payload });
    },

    async removeParserRule(payload: Record<string, unknown>) {
      return client.request('DELETE', '/api/v2/log-type/parser-rules', { body: payload });
    },
  };
}
