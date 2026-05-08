import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ChangePasswordPage from './ChangePasswordPage';
import { useAuthStore } from '../store/useAuthStore';
import type { User } from '../api/auth';

const mockUser: User = {
  id: 'u1',
  username: 'admin',
  fullName: 'Admin',
  role: 'admin',
  mustChangePassword: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderChangePasswordPage() {
  return render(
    <MemoryRouter initialEntries={['/change-password']}>
      <Routes>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    useAuthStore.setState({
      user: mockUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the security banner', () => {
    renderChangePasswordPage();
    expect(screen.getByText(/you must change your password/i)).toBeInTheDocument();
  });

  it('shows error when new password is too short', async () => {
    renderChangePasswordPage();

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 4 characters/i)).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    renderChangePasswordPage();

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass1' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass2' } });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    });
  });

  it('navigates to /dashboard on successful password change', async () => {
    vi.spyOn(useAuthStore.getState(), 'changePassword').mockResolvedValueOnce(undefined);

    renderChangePasswordPage();

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass1' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass1' } });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });
});
