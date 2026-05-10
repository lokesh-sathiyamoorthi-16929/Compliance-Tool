import { apiRequest } from './client';

export interface Log360Credentials {
  configured: boolean;
  baseUrl?: string;
  hasToken: boolean;
  updatedAt?: string;
}

export const log360CredentialsApi = {
  get(): Promise<Log360Credentials> {
    return apiRequest<Log360Credentials>('/integrations/log360/credentials');
  },
  save(payload: { baseUrl: string; authToken: string }): Promise<void> {
    return apiRequest<void>('/integrations/log360/credentials', {
      method: 'PUT',
      body: payload,
    });
  },
  delete(): Promise<void> {
    return apiRequest<void>('/integrations/log360/credentials', {
      method: 'DELETE',
    });
  },
};
