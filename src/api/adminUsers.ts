import { apiRequest } from './client';

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName?: string;
  role?: string;
}

export function listUsers() {
  return apiRequest<AdminUser[]>('/admin/users');
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<AdminUser>('/admin/users', {
    method: 'POST',
    body: payload,
  });
}
