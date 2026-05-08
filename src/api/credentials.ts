import { apiRequest } from './client';

export interface CredentialMeta {
  id: string;
  name: string;
  type: 'log360' | 'ad360';
  serverUrl: string;
  createdAt: string;
  lastTestAt: string | null;
  lastTestStatus: 'success' | 'failure' | null;
  lastTestError: string | null;
}

export interface CreateCredentialPayload {
  name: string;
  type: 'log360' | 'ad360';
  serverUrl: string;
  apiKey: string;
}

export const credentialsApi = {
  list(): Promise<CredentialMeta[]> {
    return apiRequest<CredentialMeta[]>('/credentials');
  },

  create(payload: CreateCredentialPayload): Promise<CredentialMeta> {
    return apiRequest<CredentialMeta>('/credentials', {
      method: 'POST',
      body: payload,
    });
  },

  delete(id: string): Promise<void> {
    return apiRequest<void>(`/credentials/${id}`, {
      method: 'DELETE',
    });
  },

  test(id: string): Promise<CredentialMeta> {
    return apiRequest<CredentialMeta>(`/credentials/${id}/test`, {
      method: 'POST',
    });
  },
};
