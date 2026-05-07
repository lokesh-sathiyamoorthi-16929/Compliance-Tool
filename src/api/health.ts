import { apiRequest } from './client';

export interface HealthResponse {
  status: string;
  uptime: number;
  version: string;
  db: string;
}

export function health() {
  return apiRequest<HealthResponse>('/health', {
    method: 'GET',
    skipAuth: true,
    retryOn401: false,
  });
}
