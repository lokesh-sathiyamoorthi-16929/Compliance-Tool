import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../store/useAuthStore';
import type { User } from '../api/auth';

const mockAdminUser: User = {
  id: 'u1',
  username: 'admin',
  fullName: 'Admin User',
  role: 'admin',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockMemberUser: User = {
  id: 'u2',
  username: 'member',
  fullName: 'Member User',
  role: 'member',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockMustChangeUser: User = {
  id: 'u3',
  username: 'newuser',
  fullName: 'New User',
  role: 'member',
  mustChangePassword: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderProtectedRoute(initialPath: string, requireRole?: 'admin') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/change-password" element={<div>Change Password Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route element={<ProtectedRoute requireRole={requireRole} />}>
          <Route path="/protected" element={<div>Protected Page</div>} />
          <Route path="/admin/users" element={<div>Admin Users Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'unauthenticated',
    });
    window.localStorage.removeItem('complianceiq_auth');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('redirects to login when unauthenticated in connected mode', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');

    renderProtectedRoute('/protected');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
  });

  it('passes through in demo mode', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_DEMO_MODE', 'true');

    renderProtectedRoute('/protected');

    expect(screen.getByText('Protected Page')).toBeInTheDocument();
  });

  it('redirects mustChangePassword user to /change-password', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');

    useAuthStore.setState({
      user: mockMustChangeUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });

    renderProtectedRoute('/protected');

    expect(screen.getByText('Change Password Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
  });

  it('allows authenticated user with mustChangePassword=false through', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');

    useAuthStore.setState({
      user: mockAdminUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });

    renderProtectedRoute('/protected');

    expect(screen.getByText('Protected Page')).toBeInTheDocument();
  });

  it('blocks non-admin from admin route', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');

    useAuthStore.setState({
      user: mockMemberUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });

    renderProtectedRoute('/admin/users', 'admin');

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Users Page')).not.toBeInTheDocument();
  });

  it('allows admin to access admin route', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');

    useAuthStore.setState({
      user: mockAdminUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });

    renderProtectedRoute('/admin/users', 'admin');

    expect(screen.getByText('Admin Users Page')).toBeInTheDocument();
  });
});
