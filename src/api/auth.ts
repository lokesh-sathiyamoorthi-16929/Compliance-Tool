import { apiRequest } from './client';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function login(payload: { username: string; password: string }) {
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

export function changePassword(payload: { currentPassword: string; newPassword: string }) {
  return apiRequest<void>('/auth/change-password', {
    method: 'POST',
    body: payload,
  });
}

export function me() {
  return apiRequest<User>('/me');
}
