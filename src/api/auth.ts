import { apiRequest } from './client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  inviteToken?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

export function refresh(refreshToken: string) {
  return apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    skipAuth: true,
    retryOn401: false,
  });
}

export function logout() {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
  });
}

export function me() {
  return apiRequest<User>('/me');
}
