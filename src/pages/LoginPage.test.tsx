import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import { useAuthStore } from '../store/useAuthStore';
import type { User } from '../api/auth';

const mockUserNoChange: User = {
  id: 'u1',
  username: 'testuser',
  fullName: 'Test User',
  role: 'member',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockUserMustChange: User = {
  id: 'u2',
  username: 'admin',
  fullName: 'Admin',
  role: 'admin',
  mustChangePassword: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/change-password" element={<div>Change Password Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, status: 'idle' });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders Username field (not Email)', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('renders helper text about asking administrator', () => {
    renderLoginPage();
    expect(screen.getByText(/Ask your administrator/)).toBeInTheDocument();
  });

  it('shows error when submitting empty form', async () => {
    renderLoginPage();
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Username is required.')).toBeInTheDocument();
    });
  });

  it('navigates to /change-password when mustChangePassword is true', async () => {
    vi.spyOn(useAuthStore.getState(), 'login').mockImplementation(async () => {
      useAuthStore.setState({
        user: mockUserMustChange,
        accessToken: 'token',
        refreshToken: 'refresh',
        status: 'authenticated',
      });
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Change Password Page')).toBeInTheDocument();
    });
  });

  it('navigates to /dashboard when mustChangePassword is false', async () => {
    vi.spyOn(useAuthStore.getState(), 'login').mockImplementation(async () => {
      useAuthStore.setState({
        user: mockUserNoChange,
        accessToken: 'token',
        refreshToken: 'refresh',
        status: 'authenticated',
      });
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });

  it('shows INVALID_CREDENTIALS error message', async () => {
    const { ApiError } = await import('../api/client');
    vi.spyOn(useAuthStore.getState(), 'login').mockRejectedValueOnce(
      new ApiError('INVALID_CREDENTIALS', 'Invalid credentials', 401),
    );

    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect username or password.')).toBeInTheDocument();
    });
  });
});
