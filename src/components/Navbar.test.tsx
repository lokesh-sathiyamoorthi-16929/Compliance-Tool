import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuthStore } from '../store/useAuthStore';
import type { User } from '../api/auth';

const adminUser: User = {
  id: 'u1',
  username: 'admin',
  fullName: 'Admin User',
  role: 'admin',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('Navbar', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: adminUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hides Log360 nav entry in demo mode', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_DEMO_MODE', 'true');

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Integrations · Log360')).not.toBeInTheDocument();
  });

  it('shows Log360 nav entry for admin in connected mode', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /AU/i }));
    expect(screen.getByText('Integrations · Log360')).toBeInTheDocument();
  });
});
