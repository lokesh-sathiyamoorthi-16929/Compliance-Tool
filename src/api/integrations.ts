import { apiRequest } from './client';

export interface Log360Credentials {
  configured: boolean;
  baseUrl?: string;
  hasToken: boolean;
  updatedAt?: string;
}

export interface Ad360Credentials {
  configured: boolean;
  baseUrl?: string;
  defaultDomain?: string;
  useProxy?: boolean;
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

export const ad360CredentialsApi = {
  get(): Promise<Ad360Credentials> {
    return apiRequest<Ad360Credentials>('/integrations/ad360/credentials');
  },
  save(payload: { baseUrl: string; authToken: string; defaultDomain: string; useProxy: boolean }): Promise<void> {
    return apiRequest<void>('/integrations/ad360/credentials', {
      method: 'PUT',
      body: payload,
    });
  },
  delete(): Promise<void> {
    return apiRequest<void>('/integrations/ad360/credentials', {
      method: 'DELETE',
    });
  },
};
